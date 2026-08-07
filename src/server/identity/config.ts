import 'server-only'

import { z } from 'zod'

const identityConfigSchema = z.object({
  IDENTITY_DATABASE_URL: z
    .string()
    .url()
    .refine((value) => value.startsWith('postgresql://'), {
      message: 'IDENTITY_DATABASE_URL must use postgresql://',
    }),
  REDIS_URL: z.string().url(),
  KEYCLOAK_ISSUER_URL: z.string().url(),
  KEYCLOAK_ADMIN_URL: z.string().url(),
  KEYCLOAK_CLIENT_ID: z.string().min(1),
  KEYCLOAK_AUDIENCE: z.string().min(1),
  KEYCLOAK_CLIENT_SECRET: z.string().optional(),
  IDENTITY_CALLBACK_URL: z
    .string()
    .url()
    .default('http://127.0.0.1:3100/api/identity/auth/callback'),
  IDENTITY_SESSION_SECRET: z
    .string()
    .min(32)
    .default('development-only-identity-session-secret-change-me'),
  IDENTITY_DEV_SESSION_BRIDGE: z.coerce.boolean().default(false),
  IDENTITY_METRICS_TOKEN: z.string().min(16).max(256).optional(),
  IDENTITY_DB_POOL_SIZE: z.coerce.number().int().min(2).max(50).default(10),
})

export type IdentityConfig = z.infer<typeof identityConfigSchema>

let cachedConfig: IdentityConfig | null = null
const DEVELOPMENT_SESSION_SECRET =
  'development-only-identity-session-secret-change-me'

export function isIdentityPlatformConfigured() {
  return Boolean(
    process.env.IDENTITY_DATABASE_URL &&
    process.env.REDIS_URL &&
    process.env.KEYCLOAK_ISSUER_URL,
  )
}

export function getIdentityConfig(): IdentityConfig {
  if (cachedConfig) return cachedConfig

  const result = identityConfigSchema.safeParse(process.env)
  if (!result.success) {
    const fields = Object.keys(result.error.flatten().fieldErrors).join(', ')
    throw new Error(`Identity platform configuration is invalid: ${fields}`)
  }
  if (
    process.env.NODE_ENV === 'production' &&
    result.data.IDENTITY_SESSION_SECRET === DEVELOPMENT_SESSION_SECRET
  ) {
    throw new Error('IDENTITY_SESSION_SECRET must be replaced in production.')
  }

  cachedConfig = result.data
  return cachedConfig
}
