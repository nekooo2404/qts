import 'server-only'

import type { QueryResultRow } from 'pg'
import { z } from 'zod'

import { withTenantTransaction } from '@/server/identity/database'
import { IdentityHttpError } from '@/server/identity/http'
import { recordTenantAudit } from '@/server/identity/tenant-service'

export const IDENTITY_PROVIDER_TYPES = [
  'GOOGLE',
  'MICROSOFT',
  'OIDC',
  'SAML',
  'LDAP',
] as const

export type IdentityProviderType = (typeof IDENTITY_PROVIDER_TYPES)[number]
export type IdentityProviderStatus = 'ACTIVE' | 'SUSPENDED'

const aliasSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(
    /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/,
    'Alias must contain lowercase letters, numbers and hyphens only.',
  )

const secretRefSchema = z
  .string()
  .trim()
  .min(10)
  .max(512)
  .regex(
    /^(?:vault|secret|aws-secretsmanager|gcp-secret|azure-keyvault):\/\/[A-Za-z0-9][A-Za-z0-9._:/@+=-]{1,510}$/i,
    'secretRef must be a managed-secret reference, not a secret value.',
  )

const clientIdSchema = z.string().trim().min(1).max(512)
const scopesSchema = z
  .array(z.string().trim().min(1).max(120))
  .max(40)
  .default(['openid', 'profile', 'email'])

const httpsUrlSchema = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((value) => new URL(value).protocol === 'https:', {
    message: 'Identity provider endpoints must use HTTPS.',
  })

const googleConfigurationSchema = z
  .object({
    clientId: clientIdSchema,
    hostedDomain: z.string().trim().min(1).max(253).optional(),
    scopes: scopesSchema,
  })
  .strict()

const microsoftConfigurationSchema = z
  .object({
    clientId: clientIdSchema,
    tenant: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(
        /^(?:common|organizations|consumers|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i,
        'Microsoft tenant must be common, organizations, consumers, or a tenant UUID.',
      )
      .default('organizations'),
    scopes: scopesSchema,
  })
  .strict()

const oidcConfigurationSchema = z
  .object({
    issuerUrl: httpsUrlSchema,
    clientId: clientIdSchema,
    scopes: scopesSchema,
  })
  .strict()

const samlConfigurationSchema = z
  .object({
    entityId: z.string().trim().min(1).max(2048),
    ssoUrl: httpsUrlSchema,
    certificateRef: secretRefSchema.optional(),
    nameIdFormat: z
      .enum(['EMAIL', 'PERSISTENT', 'TRANSIENT', 'UNSPECIFIED'])
      .default('EMAIL'),
  })
  .strict()

const ldapConfigurationSchema = z
  .object({
    connectionUrl: z
      .string()
      .trim()
      .url()
      .max(2048)
      .refine((value) => new URL(value).protocol === 'ldaps:', {
        message: 'LDAP federation must use LDAPS.',
      }),
    baseDn: z.string().trim().min(1).max(512),
    userSearchFilter: z.string().trim().min(1).max(512).default('(uid={0})'),
    usernameAttribute: z.string().trim().min(1).max(120).default('uid'),
    bindDn: z.string().trim().min(1).max(512).optional(),
    startTls: z.literal(false).default(false),
  })
  .strict()

const providerConfigurationSchemas: Record<
  IdentityProviderType,
  z.ZodType<Record<string, unknown>>
> = {
  GOOGLE: googleConfigurationSchema,
  MICROSOFT: microsoftConfigurationSchema,
  OIDC: oidcConfigurationSchema,
  SAML: samlConfigurationSchema,
  LDAP: ldapConfigurationSchema,
}

const providerInputBase = {
  alias: aliasSchema,
  displayName: z.string().trim().min(2).max(160),
  secretRef: secretRefSchema.optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).default('ACTIVE'),
}

export const createIdentityProviderSchema = z.discriminatedUnion('type', [
  z
    .object({
      ...providerInputBase,
      type: z.literal('GOOGLE'),
      configuration: googleConfigurationSchema,
    })
    .strict(),
  z
    .object({
      ...providerInputBase,
      type: z.literal('MICROSOFT'),
      configuration: microsoftConfigurationSchema,
    })
    .strict(),
  z
    .object({
      ...providerInputBase,
      type: z.literal('OIDC'),
      configuration: oidcConfigurationSchema,
    })
    .strict(),
  z
    .object({
      ...providerInputBase,
      type: z.literal('SAML'),
      configuration: samlConfigurationSchema,
    })
    .strict(),
  z
    .object({
      ...providerInputBase,
      type: z.literal('LDAP'),
      configuration: ldapConfigurationSchema,
    })
    .strict(),
])

const updateConfigurationSchema = z.record(z.string(), z.unknown())

export const updateIdentityProviderSchema = z
  .object({
    alias: aliasSchema.optional(),
    displayName: z.string().trim().min(2).max(160).optional(),
    secretRef: secretRefSchema.nullable().optional(),
    configuration: updateConfigurationSchema.optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one identity provider field must be updated.',
  })

export type CreateIdentityProviderInput = z.infer<
  typeof createIdentityProviderSchema
>
export type UpdateIdentityProviderInput = z.infer<
  typeof updateIdentityProviderSchema
>

export function validateProviderConfiguration(
  type: IdentityProviderType,
  value: unknown,
) {
  const schema = providerConfigurationSchemas[type]
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new IdentityHttpError(
      422,
      'INVALID_IDENTITY_PROVIDER_CONFIGURATION',
      'Identity provider configuration is invalid.',
      z.flattenError(result.error),
    )
  }
  return result.data
}

type IdentityProviderSelectRow = QueryResultRow & {
  id: string
  tenant_id: string
  type: IdentityProviderType
  alias: string
  display_name: string
  configuration: unknown
  status: IdentityProviderStatus
  has_secret_ref: boolean
  created_at: Date
  updated_at: Date
}

export type IdentityProvider = {
  id: string
  tenantId: string
  type: IdentityProviderType
  alias: string
  displayName: string
  configuration: Record<string, unknown>
  status: IdentityProviderStatus
  hasSecretRef: boolean
  createdAt: Date
  updatedAt: Date
}

function safePublicConfiguration(
  type: IdentityProviderType,
  value: unknown,
): Record<string, unknown> {
  const result = providerConfigurationSchemas[type].safeParse(value)
  return result.success ? result.data : {}
}

export function mapIdentityProviderRow(
  row: IdentityProviderSelectRow,
): IdentityProvider {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    type: row.type,
    alias: row.alias,
    displayName: row.display_name,
    configuration: safePublicConfiguration(row.type, row.configuration),
    status: row.status,
    hasSecretRef: Boolean(row.has_secret_ref),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const providerSelect = `
  id,
  tenant_id,
  type::text AS type,
  alias,
  display_name,
  configuration,
  status,
  (secret_ref IS NOT NULL) AS has_secret_ref,
  created_at,
  updated_at
`

function assertProviderType(
  type: string,
): asserts type is IdentityProviderType {
  if (!IDENTITY_PROVIDER_TYPES.includes(type as IdentityProviderType)) {
    throw new IdentityHttpError(
      500,
      'INVALID_STORED_IDENTITY_PROVIDER_TYPE',
      'The identity provider type stored for this tenant is invalid.',
    )
  }
}

async function enqueueProviderSync(
  client: { query: (text: string, values?: unknown[]) => Promise<unknown> },
  input: {
    tenantId: string
    providerId: string
    type: IdentityProviderType
    alias: string
  },
) {
  await client.query(
    `INSERT INTO identity.outbox_events
       (tenant_id, event_type, aggregate_type, aggregate_id, payload)
     VALUES ($1, 'IDP_SYNC_REQUESTED', 'identity_provider', $2, $3::jsonb)`,
    [
      input.tenantId,
      input.providerId,
      JSON.stringify({
        providerId: input.providerId,
        type: input.type,
        alias: input.alias,
      }),
    ],
  )
}

export async function listIdentityProviders(tenantId: string) {
  return withTenantTransaction(tenantId, async (client) => {
    const result = await client.query<IdentityProviderSelectRow>(
      `SELECT ${providerSelect}
       FROM identity.identity_providers
       WHERE tenant_id = $1
       ORDER BY created_at DESC, id DESC`,
      [tenantId],
    )
    return result.rows.map((row) => {
      assertProviderType(row.type)
      return mapIdentityProviderRow(row)
    })
  })
}

export async function getIdentityProvider(
  tenantId: string,
  providerId: string,
) {
  return withTenantTransaction(tenantId, async (client) => {
    const result = await client.query<IdentityProviderSelectRow>(
      `SELECT ${providerSelect}
       FROM identity.identity_providers
       WHERE tenant_id = $1 AND id = $2`,
      [tenantId, providerId],
    )
    const row = result.rows[0]
    if (!row) {
      throw new IdentityHttpError(
        404,
        'IDENTITY_PROVIDER_NOT_FOUND',
        'Identity provider not found.',
      )
    }
    assertProviderType(row.type)
    return mapIdentityProviderRow(row)
  })
}

export async function createIdentityProvider(
  tenantId: string,
  input: CreateIdentityProviderInput,
  context: { actorSubject: string; requestId?: string },
) {
  const configuration = validateProviderConfiguration(
    input.type,
    input.configuration,
  )

  try {
    return await withTenantTransaction(tenantId, async (client) => {
      const tenant = await client.query(
        `SELECT id FROM identity.tenants
         WHERE id = $1 AND status <> 'DELETED'`,
        [tenantId],
      )
      if (!tenant.rowCount) {
        throw new IdentityHttpError(
          404,
          'TENANT_NOT_FOUND',
          'Tenant not found.',
        )
      }

      const result = await client.query<IdentityProviderSelectRow>(
        `INSERT INTO identity.identity_providers
          (tenant_id, type, alias, display_name, secret_ref, configuration, status)
         VALUES ($1, $2::identity.idp_type, $3, $4, $5, $6::jsonb, $7)
         RETURNING ${providerSelect}`,
        [
          tenantId,
          input.type,
          input.alias,
          input.displayName,
          input.secretRef ?? null,
          JSON.stringify(configuration),
          input.status,
        ],
      )
      const row = result.rows[0]
      if (!row) throw new Error('Identity provider insert returned no row.')

      await recordTenantAudit(client, {
        tenantId,
        actorSubject: context.actorSubject,
        action: 'IDENTITY_PROVIDER_CREATED',
        resourceType: 'identity_provider',
        resourceId: row.id,
        requestId: context.requestId,
        metadata: {
          type: input.type,
          alias: input.alias,
          status: input.status,
        },
      })
      assertProviderType(row.type)
      await enqueueProviderSync(client, {
        tenantId,
        providerId: row.id,
        type: row.type,
        alias: row.alias,
      })

      return mapIdentityProviderRow(row)
    })
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw new IdentityHttpError(
        409,
        'IDENTITY_PROVIDER_ALIAS_CONFLICT',
        'An identity provider with this alias already exists for the tenant.',
      )
    }
    throw error
  }
}

export async function updateIdentityProvider(
  tenantId: string,
  providerId: string,
  input: UpdateIdentityProviderInput,
  context: { actorSubject: string; requestId?: string },
) {
  return withTenantTransaction(tenantId, async (client) => {
    const current = await client.query<
      QueryResultRow & {
        id: string
        type: IdentityProviderType
        alias: string
        display_name: string
        secret_ref: string | null
        configuration: unknown
        status: IdentityProviderStatus
      }
    >(
      `SELECT id, type::text AS type, alias, display_name, secret_ref,
              configuration, status
       FROM identity.identity_providers
       WHERE tenant_id = $1 AND id = $2
       FOR UPDATE`,
      [tenantId, providerId],
    )
    const existing = current.rows[0]
    if (!existing) {
      throw new IdentityHttpError(
        404,
        'IDENTITY_PROVIDER_NOT_FOUND',
        'Identity provider not found.',
      )
    }
    assertProviderType(existing.type)

    const configuration = input.configuration
      ? validateProviderConfiguration(existing.type, input.configuration)
      : safePublicConfiguration(existing.type, existing.configuration)

    const result = await client.query<IdentityProviderSelectRow>(
      `UPDATE identity.identity_providers
       SET alias = $3,
           display_name = $4,
           secret_ref = $5,
           configuration = $6::jsonb,
           status = $7,
           updated_at = now()
       WHERE tenant_id = $1 AND id = $2
       RETURNING ${providerSelect}`,
      [
        tenantId,
        providerId,
        input.alias ?? existing.alias,
        input.displayName ?? existing.display_name,
        input.secretRef === undefined ? existing.secret_ref : input.secretRef,
        JSON.stringify(configuration),
        input.status ?? existing.status,
      ],
    )
    const row = result.rows[0]
    if (!row) throw new Error('Identity provider update returned no row.')

    await recordTenantAudit(client, {
      tenantId,
      actorSubject: context.actorSubject,
      action: 'IDENTITY_PROVIDER_UPDATED',
      resourceType: 'identity_provider',
      resourceId: row.id,
      requestId: context.requestId,
      metadata: {
        providerId,
        type: existing.type,
        fields: Object.keys(input).sort().join(','),
      },
    })
    assertProviderType(row.type)
    await enqueueProviderSync(client, {
      tenantId,
      providerId: row.id,
      type: row.type,
      alias: row.alias,
    })

    return mapIdentityProviderRow(row)
  })
}

export async function suspendIdentityProvider(
  tenantId: string,
  providerId: string,
  context: { actorSubject: string; requestId?: string },
) {
  return withTenantTransaction(tenantId, async (client) => {
    const result = await client.query<IdentityProviderSelectRow>(
      `UPDATE identity.identity_providers
       SET status = 'SUSPENDED', updated_at = now()
       WHERE tenant_id = $1 AND id = $2
       RETURNING ${providerSelect}`,
      [tenantId, providerId],
    )
    const row = result.rows[0]
    if (!row) {
      throw new IdentityHttpError(
        404,
        'IDENTITY_PROVIDER_NOT_FOUND',
        'Identity provider not found.',
      )
    }
    await recordTenantAudit(client, {
      tenantId,
      actorSubject: context.actorSubject,
      action: 'IDENTITY_PROVIDER_SUSPENDED',
      resourceType: 'identity_provider',
      resourceId: row.id,
      requestId: context.requestId,
      metadata: { alias: row.alias },
    })
    assertProviderType(row.type)
    await enqueueProviderSync(client, {
      tenantId,
      providerId: row.id,
      type: row.type,
      alias: row.alias,
    })
    return mapIdentityProviderRow(row)
  })
}
