import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'

import { Pool } from 'pg'

const databaseUrl = process.env.IDENTITY_DATABASE_URL
if (!databaseUrl) throw new Error('IDENTITY_DATABASE_URL is required.')

const pool = new Pool({ connectionString: databaseUrl, max: 1 })
const client = await pool.connect()

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

try {
  await client.query('BEGIN')
  await client.query("SET LOCAL statement_timeout = '10s'")

  const tenantResult = await client.query<{ id: string }>(
    `INSERT INTO identity.tenants (key, name, status)
     VALUES ('workflow-smoke-' || substr(gen_random_uuid()::text, 1, 8), 'Workflow Smoke', 'ACTIVE')
     RETURNING id`,
  )
  const tenantId = tenantResult.rows[0]?.id
  assert.ok(tenantId)
  await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId])

  await client.query(
    `INSERT INTO identity.roles (tenant_id, key, name, managed)
     VALUES ($1, 'ADMIN', 'Admin', true), ($1, 'MANAGER', 'Manager', true), ($1, 'EMPLOYEE', 'Employee', true)`,
    [tenantId],
  )
  await client.query(
    `INSERT INTO identity.role_permissions (role_id, permission_key)
     SELECT role.id, permission.key
     FROM identity.roles role CROSS JOIN identity.permissions permission
     WHERE role.tenant_id = $1 AND (role.key = 'ADMIN' OR
       (role.key = 'MANAGER' AND permission.key IN ('USER_CREATE', 'USER_READ', 'USER_UPDATE', 'REPORT_VIEW')) OR
       (role.key = 'EMPLOYEE' AND permission.key = 'REPORT_VIEW'))
     ON CONFLICT DO NOTHING`,
    [tenantId],
  )

  const role = await client.query<{ id: string }>(
    `SELECT id FROM identity.roles WHERE tenant_id = $1 AND key = 'MANAGER'`,
    [tenantId],
  )
  assert.ok(role.rows[0]?.id)
  const user = await client.query<{ id: string }>(
    `INSERT INTO identity.users (keycloak_subject, email, display_name)
     VALUES ($1, $2, $3) RETURNING id`,
    [
      `workflow-${randomBytes(8).toString('hex')}`,
      'workflow@example.test',
      'Workflow User',
    ],
  )
  assert.ok(user.rows[0]?.id)
  const membership = await client.query<{ id: string }>(
    `INSERT INTO identity.memberships (tenant_id, user_id, role_id, status)
     VALUES ($1, $2, $3, 'ACTIVE') RETURNING id`,
    [tenantId, user.rows[0]!.id, role.rows[0]!.id],
  )
  assert.ok(membership.rows[0]?.id)

  const invitationToken = randomBytes(32).toString('base64url')
  const invitation = await client.query<{ id: string; role_id: string }>(
    `INSERT INTO identity.invitations (tenant_id, email, token_hash, role_id, expires_at)
     VALUES ($1, 'new-user@example.test', $2, $3, now() + interval '1 hour')
     RETURNING id, role_id`,
    [tenantId, sha256(invitationToken), role.rows[0]!.id],
  )
  assert.ok(invitation.rows[0]?.id)

  const acceptedUser = await client.query<{ id: string }>(
    `INSERT INTO identity.users (keycloak_subject, email, display_name, status, last_login_at)
     VALUES ('workflow-accepted', 'new-user@example.test', 'New User', 'ACTIVE', now())
     ON CONFLICT (keycloak_subject) DO UPDATE SET status = 'ACTIVE', updated_at = now()
     RETURNING id`,
  )
  const acceptedMembership = await client.query<{
    id: string
    role_key: string
  }>(
    `INSERT INTO identity.memberships (tenant_id, user_id, role_id, status, joined_at)
     VALUES ($1, $2, $3, 'ACTIVE', now())
     ON CONFLICT (tenant_id, user_id) DO UPDATE
       SET role_id = EXCLUDED.role_id, status = 'ACTIVE',
           joined_at = COALESCE(identity.memberships.joined_at, now()), updated_at = now()
     RETURNING id, status, (SELECT key FROM identity.roles WHERE id = identity.memberships.role_id) AS role_key`,
    [tenantId, acceptedUser.rows[0]!.id, invitation.rows[0]!.role_id],
  )
  assert.equal(acceptedMembership.rows[0]?.role_key, 'MANAGER')

  const updated = await client.query<{ role_key: string }>(
    `UPDATE identity.memberships membership
     SET status = 'SUSPENDED', updated_at = now()
     FROM identity.roles role
     WHERE membership.id = $1 AND membership.tenant_id = $2 AND role.id = membership.role_id
     RETURNING role.key AS role_key`,
    [membership.rows[0]!.id, tenantId],
  )
  assert.equal(updated.rows[0]?.role_key, 'MANAGER')

  const application = await client.query<{ id: string }>(
    `INSERT INTO identity.applications
       (tenant_id, client_id, client_secret_hash, name, type, redirect_uris, scopes)
     VALUES ($1, 'workflow-client-' || substr(gen_random_uuid()::text, 1, 8), $2, 'Workflow CRM', 'CONFIDENTIAL', '["https://crm.example.test/callback"]'::jsonb, '["openid"]'::jsonb)
     RETURNING id`,
    [tenantId, sha256('one-time-secret')],
  )
  assert.ok(application.rows[0]?.id)

  const policy = await client.query<{ id: string }>(
    `INSERT INTO identity.policies (tenant_id, name, effect, resource, action, conditions)
     VALUES ($1, 'Same department', 'ALLOW', 'report', 'view', $2::jsonb)
     RETURNING id`,
    [
      tenantId,
      JSON.stringify([
        {
          attribute: 'subject.department',
          operator: 'EQUALS',
          value: 'finance',
        },
      ]),
    ],
  )
  assert.ok(policy.rows[0]?.id)

  await client.query(
    `INSERT INTO identity.audit_events (tenant_id, action, resource_type, resource_id, outcome, metadata)
     VALUES ($1, 'WORKFLOW_SMOKE', 'workflow', $2, 'SUCCESS', '{"safe":true}'::jsonb)`,
    [tenantId, tenantId],
  )
  await client.query(
    `INSERT INTO identity.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
     VALUES ($1, 'WORKFLOW_SMOKE', 'workflow', $2, '{}'::jsonb)`,
    [tenantId, tenantId],
  )
  const tenantAudit = await client.query('SELECT id FROM identity.audit_events')
  assert.ok(tenantAudit.rowCount && tenantAudit.rowCount >= 1)

  await client.query("SELECT set_config('app.platform_admin', 'true', true)")
  const platformAudit = await client.query(
    'SELECT id FROM identity.audit_events',
  )
  assert.ok(
    platformAudit.rowCount && platformAudit.rowCount >= tenantAudit.rowCount,
  )

  console.log('Identity workflow smoke checks passed.')
} finally {
  await client.query('ROLLBACK')
  client.release()
  await pool.end()
}
