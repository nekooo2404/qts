import 'server-only'

import { randomBytes } from 'node:crypto'
import type { QueryResultRow } from 'pg'

import { withTenantTransaction } from '@/server/identity/database'
import { IdentityHttpError } from '@/server/identity/http'
import { policyConditionsSchema } from '@/server/identity/schemas'
import { sha256 } from '@/lib/security/hash'
import { recordTenantAudit } from '@/server/identity/tenant-service'
import { getMembershipRoleMutationError } from '@/server/identity/membership-policy'
import type {
  AbacPolicy,
  AuthorizationSubject,
  IdentityPermission,
  IdentityRole,
  PolicyEffect,
} from '@/server/identity/types'

type MembershipRow = QueryResultRow & {
  membership_id: string
  tenant_id: string
  tenant_status: string
  user_id: string
  role_key: IdentityRole
  attributes: Record<string, unknown>
  role_permissions: IdentityPermission[]
  overrides: Record<IdentityPermission, PolicyEffect> | null
}

export async function loadAuthorizationContext(
  tenantId: string,
  keycloakSubject: string,
) {
  return withTenantTransaction(tenantId, async (client) => {
    const membership = await client.query<MembershipRow>(
      `SELECT
         membership.id AS membership_id,
         membership.tenant_id,
         tenant.status::text AS tenant_status,
         membership.user_id,
         role.key AS role_key,
         membership.attributes,
         COALESCE(
           array_agg(DISTINCT role_permission.permission_key)
             FILTER (WHERE role_permission.permission_key IS NOT NULL),
           ARRAY[]::text[]
         ) AS role_permissions,
         COALESCE(
           jsonb_object_agg(permission.permission_key, permission.effect)
             FILTER (WHERE permission.permission_key IS NOT NULL),
           '{}'::jsonb
         ) AS overrides
       FROM identity.memberships membership
       JOIN identity.tenants tenant ON tenant.id = membership.tenant_id
       JOIN identity.users identity_user ON identity_user.id = membership.user_id
       JOIN identity.roles role ON role.id = membership.role_id
       LEFT JOIN identity.membership_permissions permission
         ON permission.membership_id = membership.id
       LEFT JOIN identity.role_permissions role_permission
         ON role_permission.role_id = role.id
       WHERE membership.tenant_id = $1
         AND identity_user.keycloak_subject = $2
         AND membership.status = 'ACTIVE'
         AND identity_user.status = 'ACTIVE'
       GROUP BY membership.id, role.key, tenant.status`,
      [tenantId, keycloakSubject],
    )
    const row = membership.rows[0]
    if (!row) {
      throw new IdentityHttpError(
        403,
        'TENANT_MEMBERSHIP_REQUIRED',
        'An active tenant membership is required.',
      )
    }
    if (row.tenant_status !== 'ACTIVE') {
      throw new IdentityHttpError(
        403,
        'TENANT_INACTIVE',
        'The tenant is not active.',
      )
    }

    const policies = await client.query<{
      id: string
      name: string
      effect: PolicyEffect
      resource: string
      action: string
      enabled: boolean
      conditions: unknown
    }>(
      `SELECT id, name, effect, resource, action, enabled, conditions
       FROM identity.policies
       WHERE tenant_id = $1 AND enabled = true
       ORDER BY created_at ASC`,
      [tenantId],
    )

    const validPolicies: AbacPolicy[] = policies.rows.flatMap((policy) => {
      const conditions = policyConditionsSchema.safeParse(policy.conditions)
      if (!conditions.success) return []
      return [{ ...policy, conditions: conditions.data }]
    })

    const subject: AuthorizationSubject = {
      userId: row.user_id,
      tenantId: row.tenant_id,
      membershipId: row.membership_id,
      role: row.role_key,
      attributes: row.attributes,
      rolePermissions: row.role_permissions,
      permissionOverrides: row.overrides ?? {},
    }

    return { subject, policies: validPolicies }
  })
}

type MemberListRow = QueryResultRow & {
  membership_id: string
  user_id: string
  keycloak_subject: string
  email: string
  display_name: string
  user_status: string
  membership_status: string
  role_key: IdentityRole
  attributes: Record<string, unknown>
  joined_at: Date | null
  role_permissions: IdentityPermission[]
  permission_overrides: Record<string, PolicyEffect>
  total_count: string | number
}

export async function listMembers(
  tenantId: string,
  input: { page?: number; pageSize?: number } = {},
) {
  return withTenantTransaction(tenantId, async (client) => {
    const page = Math.max(1, Math.floor(input.page ?? 1) || 1)
    const pageSize = Math.min(
      100,
      Math.max(1, Math.floor(input.pageSize ?? 50) || 50),
    )
    const result = await client.query<MemberListRow>(
      `SELECT
         membership.id AS membership_id,
         identity_user.id AS user_id,
         identity_user.keycloak_subject,
         identity_user.email,
         identity_user.display_name,
         identity_user.status AS user_status,
         membership.status AS membership_status,
         role.key AS role_key,
         membership.attributes,
         membership.joined_at,
         COALESCE(
           (
             SELECT array_agg(DISTINCT role_permission.permission_key)
             FROM identity.role_permissions role_permission
             WHERE role_permission.role_id = role.id
           ),
           ARRAY[]::text[]
         ) AS role_permissions,
         COALESCE(
           (
             SELECT jsonb_object_agg(member_permission.permission_key, member_permission.effect)
             FROM identity.membership_permissions member_permission
             WHERE member_permission.membership_id = membership.id
           ),
           '{}'::jsonb
         ) AS permission_overrides,
         count(*) OVER() AS total_count
       FROM identity.memberships membership
       JOIN identity.users identity_user ON identity_user.id = membership.user_id
       JOIN identity.roles role ON role.id = membership.role_id
       WHERE membership.tenant_id = $1
       ORDER BY identity_user.display_name ASC, membership.id ASC
       LIMIT $2 OFFSET $3`,
      [tenantId, pageSize, (page - 1) * pageSize],
    )
    const totalItems = Number(result.rows[0]?.total_count ?? 0)
    return {
      data: result.rows.map((row) => ({
        id: row.membership_id,
        userId: row.user_id,
        keycloakSubject: row.keycloak_subject,
        email: row.email,
        displayName: row.display_name,
        userStatus: row.user_status,
        status: row.membership_status,
        role: row.role_key,
        attributes: row.attributes,
        joinedAt: row.joined_at,
        rolePermissions: row.role_permissions,
        permissionOverrides: row.permission_overrides,
      })),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    }
  })
}

export async function createInvitation(
  tenantId: string,
  input: { email: string; role: IdentityRole; expiresInHours: number },
  context: { actorSubject: string; requestId?: string },
) {
  const invitationToken = randomBytes(32).toString('base64url')
  const tokenHash = sha256(invitationToken)
  const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000)

  return withTenantTransaction(tenantId, async (client) => {
    const role = await client.query<{ id: string }>(
      `SELECT id FROM identity.roles
       WHERE tenant_id = $1 AND key = $2`,
      [tenantId, input.role],
    )
    if (!role.rows[0]) {
      throw new IdentityHttpError(
        422,
        'ROLE_NOT_CONFIGURED',
        'The requested tenant role is not configured.',
      )
    }

    const invitation = await client.query<{
      id: string
      expires_at: Date
      created_at: Date
    }>(
      `INSERT INTO identity.invitations
        (tenant_id, email, token_hash, role_id, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, expires_at, created_at`,
      [tenantId, input.email, tokenHash, role.rows[0].id, expiresAt],
    )
    const row = invitation.rows[0]!
    await recordTenantAudit(client, {
      tenantId,
      actorSubject: context.actorSubject,
      action: 'USER_INVITATION_CREATED',
      requestId: context.requestId,
      metadata: { email: input.email, role: input.role },
    })
    return {
      id: row.id,
      email: input.email,
      role: input.role,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      invitationToken,
    }
  })
}

export async function updateMembership(
  tenantId: string,
  membershipId: string,
  input: { status?: 'ACTIVE' | 'SUSPENDED' | 'REMOVED'; role?: IdentityRole },
  context: {
    actorSubject: string
    actorRole?: IdentityRole
    requestId?: string
  },
) {
  return withTenantTransaction(tenantId, async (client) => {
    const current = await client.query<{
      id: string
      status: 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'REMOVED'
      role_key: IdentityRole
    }>(
      `SELECT membership.id, membership.status, role.key AS role_key
       FROM identity.memberships membership
       JOIN identity.roles role ON role.id = membership.role_id
       WHERE membership.id = $1 AND membership.tenant_id = $2
       FOR UPDATE`,
      [membershipId, tenantId],
    )
    const existing = current.rows[0]
    if (!existing) {
      throw new IdentityHttpError(
        404,
        'MEMBERSHIP_NOT_FOUND',
        'Membership not found.',
      )
    }

    let roleId: string | null = null
    if (input.role) {
      const role = await client.query<{ id: string }>(
        `SELECT id FROM identity.roles WHERE tenant_id = $1 AND key = $2`,
        [tenantId, input.role],
      )
      if (!role.rows[0]) {
        throw new IdentityHttpError(
          422,
          'ROLE_NOT_CONFIGURED',
          'The requested tenant role is not configured.',
        )
      }
      roleId = role.rows[0].id
    }

    const targetRole = input.role ?? existing.role_key
    const targetStatus = input.status ?? existing.status
    const roleMutationError = getMembershipRoleMutationError({
      existingRole: existing.role_key,
      targetRole,
      actorRole: context.actorRole,
    })
    if (roleMutationError) {
      throw new IdentityHttpError(
        403,
        roleMutationError.code,
        roleMutationError.message,
      )
    }
    if (
      existing.role_key === 'ADMIN' &&
      existing.status === 'ACTIVE' &&
      (targetRole !== 'ADMIN' || targetStatus !== 'ACTIVE')
    ) {
      const otherAdmins = await client.query<{ count: string }>(
        `SELECT count(*)::text AS count
         FROM identity.memberships membership
         JOIN identity.roles role ON role.id = membership.role_id
         WHERE membership.tenant_id = $1
           AND membership.id <> $2
           AND membership.status = 'ACTIVE'
           AND role.key = 'ADMIN'`,
        [tenantId, membershipId],
      )
      if (Number(otherAdmins.rows[0]?.count ?? 0) === 0) {
        throw new IdentityHttpError(
          409,
          'LAST_ADMIN_PROTECTION',
          'A tenant must retain at least one active administrator.',
        )
      }
    }

    const result = await client.query<{
      id: string
      status: string
      role_id: string
    }>(
      `UPDATE identity.memberships membership
       SET status = COALESCE($3::identity.membership_status, membership.status),
           role_id = COALESCE($4::uuid, membership.role_id),
           updated_at = now(),
           joined_at = CASE
             WHEN $3::identity.membership_status = 'ACTIVE' AND membership.joined_at IS NULL
               THEN now()
             ELSE membership.joined_at
           END
       WHERE membership.id = $1 AND membership.tenant_id = $2
       RETURNING membership.id, membership.status, membership.role_id`,
      [membershipId, tenantId, input.status ?? null, roleId],
    )
    const updated = result.rows[0]!
    const updatedRole = await client.query<{ key: IdentityRole }>(
      `SELECT key FROM identity.roles WHERE id = $1`,
      [updated.role_id],
    )
    const updatedRoleKey = updatedRole.rows[0]?.key
    if (!updatedRoleKey) {
      throw new Error('Updated membership role was not found.')
    }
    await recordTenantAudit(client, {
      tenantId,
      actorSubject: context.actorSubject,
      action: 'MEMBERSHIP_UPDATED',
      requestId: context.requestId,
      metadata: {
        membershipId,
        previousStatus: existing.status,
        status: updated.status,
        previousRole: existing.role_key,
        role: updatedRoleKey,
      },
    })
    return {
      id: updated.id,
      status: updated.status,
      role: updatedRoleKey,
    }
  })
}

export async function acceptInvitation(
  tenantId: string,
  token: string,
  principal: { subject: string; email: string; displayName?: string | null },
  context: { requestId?: string },
) {
  const tokenHash = sha256(token)
  return withTenantTransaction(tenantId, async (client) => {
    const tenant = await client.query<{ status: string }>(
      `SELECT status::text AS status
       FROM identity.tenants
       WHERE id = $1
       FOR SHARE`,
      [tenantId],
    )
    if (tenant.rows[0]?.status !== 'ACTIVE') {
      throw new IdentityHttpError(
        403,
        'TENANT_INACTIVE',
        'Invitations can only be accepted for an active tenant.',
      )
    }

    const invitationResult = await client.query<{
      id: string
      tenant_id: string
      email: string
      role_id: string
      role_key: IdentityRole
      expires_at: Date
      accepted_at: Date | null
    }>(
      `SELECT invitation.id,
              invitation.tenant_id,
              invitation.email,
              invitation.role_id,
              role.key AS role_key,
              invitation.expires_at,
              invitation.accepted_at
       FROM identity.invitations invitation
       JOIN identity.roles role ON role.id = invitation.role_id
       WHERE invitation.tenant_id = $1 AND invitation.token_hash = $2
       FOR UPDATE`,
      [tenantId, tokenHash],
    )
    const invitation = invitationResult.rows[0]
    if (
      !invitation ||
      invitation.accepted_at ||
      invitation.expires_at <= new Date()
    ) {
      throw new IdentityHttpError(
        410,
        'INVITATION_INVALID',
        'The invitation is invalid, expired, or already accepted.',
      )
    }
    if (principal.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new IdentityHttpError(
        403,
        'INVITATION_EMAIL_MISMATCH',
        'The authenticated account does not match the invitation email.',
      )
    }

    const userResult = await client.query<{ id: string }>(
      `INSERT INTO identity.users (keycloak_subject, email, display_name, status, last_login_at)
       VALUES ($1, $2, $3, 'ACTIVE', now())
       ON CONFLICT (keycloak_subject) DO UPDATE
         SET email = EXCLUDED.email,
             display_name = EXCLUDED.display_name,
             status = 'ACTIVE',
             last_login_at = now(),
             updated_at = now()
       RETURNING id`,
      [
        principal.subject,
        principal.email,
        principal.displayName ?? principal.email,
      ],
    )
    const userId = userResult.rows[0]?.id
    if (!userId) throw new Error('User upsert returned no row.')

    const membershipResult = await client.query<{
      id: string
      status: string
      role_key: IdentityRole
    }>(
      `INSERT INTO identity.memberships
         (tenant_id, user_id, role_id, status, joined_at)
       VALUES ($1, $2, $3, 'ACTIVE', now())
       ON CONFLICT (tenant_id, user_id) DO UPDATE
         SET role_id = EXCLUDED.role_id,
             status = 'ACTIVE',
             joined_at = COALESCE(identity.memberships.joined_at, now()),
             updated_at = now()
       RETURNING id, status,
         (SELECT key FROM identity.roles WHERE id = identity.memberships.role_id) AS role_key`,
      [tenantId, userId, invitation.role_id],
    )
    const membership = membershipResult.rows[0]
    if (!membership) throw new Error('Membership upsert returned no row.')

    await client.query(
      `UPDATE identity.invitations SET accepted_at = now() WHERE id = $1`,
      [invitation.id],
    )
    await recordTenantAudit(client, {
      tenantId,
      actorSubject: principal.subject,
      action: 'USER_INVITATION_ACCEPTED',
      requestId: context.requestId,
      metadata: { invitationId: invitation.id, membershipId: membership.id },
    })
    return {
      membershipId: membership.id,
      tenantId,
      userId,
      status: membership.status,
      role: membership.role_key,
    }
  })
}

export async function setMembershipPermissionOverrides(
  tenantId: string,
  membershipId: string,
  overrides: Array<{ permission: IdentityPermission; effect: PolicyEffect }>,
  context: { actorSubject: string; requestId?: string },
) {
  return withTenantTransaction(tenantId, async (client) => {
    const membership = await client.query<{ id: string }>(
      `SELECT id FROM identity.memberships
       WHERE id = $1 AND tenant_id = $2`,
      [membershipId, tenantId],
    )
    if (!membership.rows[0]) {
      throw new IdentityHttpError(
        404,
        'MEMBERSHIP_NOT_FOUND',
        'Membership not found.',
      )
    }
    const uniqueOverrides = Array.from(
      new Map(
        overrides.map((override) => [override.permission, override]),
      ).values(),
    )
    await client.query(
      `DELETE FROM identity.membership_permissions WHERE membership_id = $1`,
      [membershipId],
    )
    for (const override of uniqueOverrides) {
      await client.query(
        `INSERT INTO identity.membership_permissions
           (membership_id, permission_key, effect)
         VALUES ($1, $2, $3::identity.policy_effect)`,
        [membershipId, override.permission, override.effect],
      )
    }
    await recordTenantAudit(client, {
      tenantId,
      actorSubject: context.actorSubject,
      action: 'MEMBERSHIP_PERMISSIONS_UPDATED',
      resourceType: 'membership',
      resourceId: membershipId,
      requestId: context.requestId,
      metadata: {
        overrides: uniqueOverrides.map(({ permission, effect }) => ({
          permission,
          effect,
        })),
      },
    })
    return { membershipId, overrides: uniqueOverrides }
  })
}

export async function getMembershipPermissionOverrides(
  tenantId: string,
  membershipId: string,
) {
  return withTenantTransaction(tenantId, async (client) => {
    const result = await client.query<{
      id: string
      role_key: IdentityRole
      role_permissions: IdentityPermission[]
      permission_overrides: Record<string, PolicyEffect>
    }>(
      `SELECT
         membership.id,
         role.key AS role_key,
         COALESCE(
           (
             SELECT array_agg(DISTINCT role_permission.permission_key)
             FROM identity.role_permissions role_permission
             WHERE role_permission.role_id = role.id
           ),
           ARRAY[]::text[]
         ) AS role_permissions,
         COALESCE(
           (
             SELECT jsonb_object_agg(member_permission.permission_key, member_permission.effect)
             FROM identity.membership_permissions member_permission
             WHERE member_permission.membership_id = membership.id
           ),
           '{}'::jsonb
         ) AS permission_overrides
       FROM identity.memberships membership
       JOIN identity.roles role ON role.id = membership.role_id
       WHERE membership.id = $1 AND membership.tenant_id = $2`,
      [membershipId, tenantId],
    )
    const row = result.rows[0]
    if (!row) {
      throw new IdentityHttpError(
        404,
        'MEMBERSHIP_NOT_FOUND',
        'Membership not found.',
      )
    }
    return {
      membershipId: row.id,
      role: row.role_key,
      rolePermissions: row.role_permissions,
      permissionOverrides: row.permission_overrides,
    }
  })
}
