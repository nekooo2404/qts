import 'server-only'

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto'
import { cookies } from 'next/headers'

import {
  deleteCachedKeys,
  getCachedJson,
  getIdentityRedis,
  setCachedJson,
} from '@/server/identity/cache'
import { getIdentityConfig } from '@/server/identity/config'
import { IDENTITY_SESSION_COOKIE } from '@/server/identity/constants'

const SESSION_TTL_SECONDS = 8 * 60 * 60

export type IdentitySessionRecord = {
  subject: string
  email: string | null
  displayName: string | null
  tenantId: string | null
  accessToken: string
  refreshToken: string | null
  accessTokenExpiresAt: number
  createdAt: number
}

function encryptionKey() {
  return createHash('sha256')
    .update(getIdentityConfig().IDENTITY_SESSION_SECRET)
    .digest()
}

function encrypt(value: IdentitySessionRecord) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return [iv, tag, ciphertext]
    .map((part) => part.toString('base64url'))
    .join('.')
}

function decrypt(value: string): IdentitySessionRecord | null {
  try {
    const [ivValue, tagValue, ciphertextValue] = value.split('.')
    if (!ivValue || !tagValue || !ciphertextValue) return null
    const decipher = createDecipheriv(
      'aes-256-gcm',
      encryptionKey(),
      Buffer.from(ivValue, 'base64url'),
    )
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'))
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextValue, 'base64url')),
      decipher.final(),
    ]).toString('utf8')
    const parsed = JSON.parse(plaintext) as IdentitySessionRecord
    if (!parsed.subject || !parsed.accessToken) return null
    return parsed
  } catch {
    return null
  }
}

function sessionKey(sessionId: string) {
  return `identity:session:${createHash('sha256').update(sessionId).digest('hex')}`
}

function cookieOptions(expiresAt: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
    maxAge: Math.max(1, Math.floor((expiresAt - Date.now()) / 1000)),
    priority: 'high' as const,
  }
}

export async function createIdentitySession(
  input: Omit<IdentitySessionRecord, 'createdAt'>,
) {
  const sessionId = randomBytes(32).toString('base64url')
  const record: IdentitySessionRecord = { ...input, createdAt: Date.now() }
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000
  await setCachedJson(
    sessionKey(sessionId),
    { payload: encrypt(record) },
    Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000)),
  )
  const cookieStore = await cookies()
  cookieStore.set(IDENTITY_SESSION_COOKIE, sessionId, cookieOptions(expiresAt))
  return sessionId
}

export async function readIdentitySession(sessionId?: string) {
  const id = sessionId ?? (await cookies()).get(IDENTITY_SESSION_COOKIE)?.value
  if (!id) return null
  const stored = await getCachedJson<{ payload?: string }>(sessionKey(id))
  if (!stored?.payload) return null
  const session = decrypt(stored.payload)
  if (!session) return null
  return { id, ...session }
}

export async function updateIdentitySession(
  sessionId: string,
  input: Partial<IdentitySessionRecord>,
) {
  const existing = await readIdentitySession(sessionId)
  if (!existing) return null
  const next: IdentitySessionRecord = {
    subject: input.subject ?? existing.subject,
    email: input.email === undefined ? existing.email : input.email,
    displayName:
      input.displayName === undefined
        ? existing.displayName
        : input.displayName,
    tenantId: input.tenantId === undefined ? existing.tenantId : input.tenantId,
    accessToken: input.accessToken ?? existing.accessToken,
    refreshToken:
      input.refreshToken === undefined
        ? existing.refreshToken
        : input.refreshToken,
    accessTokenExpiresAt:
      input.accessTokenExpiresAt ?? existing.accessTokenExpiresAt,
    createdAt: existing.createdAt,
  }
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000
  await setCachedJson(
    sessionKey(sessionId),
    { payload: encrypt(next) },
    Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000)),
  )
  return { id: sessionId, ...next }
}

export async function destroyIdentitySession(sessionId?: string) {
  const cookieStore = await cookies()
  const id = sessionId ?? cookieStore.get(IDENTITY_SESSION_COOKIE)?.value
  if (id) await deleteCachedKeys([sessionKey(id)])
  cookieStore.delete(IDENTITY_SESSION_COOKIE)
}

export async function acquireIdentitySessionLock(sessionId: string) {
  const redis = await getIdentityRedis()
  const lockKey = `${sessionKey(sessionId)}:lock`
  const lockToken = randomBytes(16).toString('base64url')
  const acquired = await redis.set(lockKey, lockToken, { NX: true, PX: 15_000 })
  return {
    acquired: acquired === 'OK',
    release: async () => {
      await redis.eval(
        `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end`,
        { keys: [lockKey], arguments: [lockToken] },
      )
    },
  }
}
