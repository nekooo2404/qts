import { z } from 'zod'

import {
  IDENTITY_PERMISSIONS,
  IDENTITY_ROLES,
} from '@backend/server/identity/types'

const tenantKey = z
  .string()
  .trim()
  .min(3)
  .max(48)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const hostname = z
  .string()
  .trim()
  .toLowerCase()
  .max(253)
  .regex(
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/,
  )

export const tenantBrandingSchema = z.object({
  logoUrl: z
    .string()
    .url()
    .max(2048)
    .refine((value) => {
      const parsed = new URL(value)
      return (
        parsed.protocol === 'https:' ||
        (parsed.protocol === 'http:' &&
          ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname))
      )
    }, 'Branding assets must use HTTPS, except localhost development URLs.')
    .optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  loginTitle: z.string().trim().min(1).max(80).optional(),
})

export const createTenantSchema = z.object({
  key: tenantKey,
  name: z.string().trim().min(2).max(160),
  plan: z.string().trim().min(2).max(48).default('STARTER'),
  status: z
    .enum(['PROVISIONING', 'ACTIVE', 'SUSPENDED'])
    .default('PROVISIONING'),
  branding: tenantBrandingSchema.default({}),
})

export const updateTenantSchema = createTenantSchema
  .omit({ key: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be updated.',
  })

export const createTenantDomainSchema = z.object({ hostname })

export const verifyTenantDomainSchema = z.object({
  token: z.string().trim().min(32).max(256),
})

export const invitationSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  role: z.enum(IDENTITY_ROLES),
  expiresInHours: z.number().int().min(1).max(168).default(48),
})

export const membershipUpdateSchema = z
  .object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'REMOVED']).optional(),
    role: z.enum(IDENTITY_ROLES).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one membership field must be updated.',
  })

export const invitationAcceptSchema = z.object({
  tenantId: z.string().uuid(),
  token: z.string().trim().min(32).max(256),
})

export const applicationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(['PUBLIC', 'CONFIDENTIAL']).default('PUBLIC'),
  redirectUris: z
    .array(z.string().url().max(2048))
    .min(1)
    .max(20)
    .refine(
      (uris) =>
        uris.every((uri) => {
          let parsed: URL
          try {
            parsed = new URL(uri)
          } catch {
            return false
          }
          return (
            !parsed.hash &&
            (parsed.protocol === 'https:' ||
              (parsed.protocol === 'http:' &&
                ['localhost', '127.0.0.1'].includes(parsed.hostname)))
          )
        }),
      'Redirect URIs must use HTTPS, except localhost development URLs, and must not contain fragments.',
    ),
  allowedOrigins: z.array(z.string().url().max(2048)).max(20).default([]),
  scopes: z
    .array(z.string().trim().min(1).max(120))
    .min(1)
    .max(40)
    .default(['openid', 'profile', 'email']),
})

export const applicationUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    redirectUris: applicationSchema.shape.redirectUris.optional(),
    allowedOrigins: applicationSchema.shape.allowedOrigins.optional(),
    scopes: applicationSchema.shape.scopes.optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'REVOKED']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one application field must be updated.',
  })

export const authorizationCheckSchema = z.object({
  permission: z.enum(IDENTITY_PERMISSIONS),
  resource: z.object({
    type: z.string().trim().min(1).max(120),
    id: z.string().trim().min(1).max(200).optional(),
    attributes: z.record(z.string(), z.unknown()).default({}),
  }),
  action: z.string().trim().min(1).max(120),
  environment: z.record(z.string(), z.unknown()).default({}),
})

export const policyConditionsSchema = z.array(
  z.object({
    attribute: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*$/),
    operator: z.enum(['EQUALS', 'NOT_EQUALS', 'IN', 'CONTAINS']),
    value: z.unknown(),
  }),
)

export const policySchema = z.object({
  name: z.string().trim().min(2).max(160),
  effect: z.enum(['ALLOW', 'DENY']),
  resource: z.string().trim().min(1).max(160),
  action: z.string().trim().min(1).max(160),
  conditions: policyConditionsSchema.default([]),
  enabled: z.boolean().default(true),
})

export const policyUpdateSchema = policySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one policy field must be updated.',
  })

export const membershipPermissionOverrideSchema = z.object({
  permission: z.enum(IDENTITY_PERMISSIONS),
  effect: z.enum(['ALLOW', 'DENY']),
})

export const membershipPermissionOverridesSchema = z.object({
  overrides: z
    .array(membershipPermissionOverrideSchema)
    .max(100)
    .superRefine((overrides, context) => {
      const seen = new Set<string>()
      overrides.forEach((override, index) => {
        if (seen.has(override.permission)) {
          context.addIssue({
            code: 'custom',
            path: [index, 'permission'],
            message: 'Each permission may only be overridden once.',
          })
        }
        seen.add(override.permission)
      })
    }),
})
