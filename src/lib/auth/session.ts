import 'server-only'

import { randomBytes } from 'node:crypto'
import { cache } from 'react'
import { cookies } from 'next/headers'

import { getSessionCookieName } from '@/lib/auth/constants'
import type { RoleName } from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import { sha256 } from '@/lib/security/hash'
import { requestIp } from '@/lib/security/request'

const DEFAULT_SESSION_TTL_DAYS = 7

export type AuthUser = {
  id: string
  email: string
  name: string
  phone: string | null
  title: string | null
  avatarUrl: string | null
  role: RoleName
  roleLabel: string
  organizationId: string | null
  organizationName: string | null
}

function sessionTtlDays() {
  const configured = Number(process.env.SESSION_TTL_DAYS)
  return Number.isFinite(configured) && configured > 0
    ? Math.min(configured, 30)
    : DEFAULT_SESSION_TTL_DAYS
}

function sessionExpiry() {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + sessionTtlDays())
  return expiry
}

export async function createSession(userId: string, request: Request) {
  const token = randomBytes(32).toString('base64url')
  const tokenHash = sha256(token)
  const expiresAt = sessionExpiry()

  await db.session.deleteMany({
    where: { OR: [{ expiresAt: { lte: new Date() } }, { userId }] },
  })

  await db.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      userAgent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
      ipHash: sha256(requestIp(request)),
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
    priority: 'high',
  })
}

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(getSessionCookieName())?.value

  if (!token) {
    return null
  }

  const session = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: {
      user: {
        include: { role: true, organization: true },
      },
    },
  })

  if (!session || session.expiresAt <= new Date() || !session.user.active) {
    if (session) {
      await db.session.delete({ where: { id: session.id } })
    }
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    phone: session.user.phone,
    title: session.user.title,
    avatarUrl: session.user.avatarUrl,
    role: session.user.role.name,
    roleLabel: session.user.role.label,
    organizationId: session.user.organizationId,
    organizationName: session.user.organization?.name ?? null,
  }
})

export async function destroyCurrentSession() {
  const cookieStore = await cookies()
  const name = getSessionCookieName()
  const token = cookieStore.get(name)?.value

  if (token) {
    await db.session.deleteMany({ where: { tokenHash: sha256(token) } })
  }

  cookieStore.delete(name)
}
