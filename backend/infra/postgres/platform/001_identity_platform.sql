CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS identity;

CREATE TYPE identity.tenant_status AS ENUM ('PROVISIONING', 'ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE identity.membership_status AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED');
CREATE TYPE identity.application_status AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');
CREATE TYPE identity.idp_type AS ENUM ('GOOGLE', 'MICROSOFT', 'OIDC', 'SAML', 'LDAP');
CREATE TYPE identity.policy_effect AS ENUM ('ALLOW', 'DENY');
CREATE TYPE identity.isolation_mode AS ENUM ('SHARED', 'DEDICATED');

CREATE TABLE IF NOT EXISTS identity.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  plan text NOT NULL DEFAULT 'STARTER',
  status identity.tenant_status NOT NULL DEFAULT 'PROVISIONING',
  isolation_mode identity.isolation_mode NOT NULL DEFAULT 'SHARED',
  branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS identity.tenant_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES identity.tenants(id) ON DELETE CASCADE,
  hostname text NOT NULL UNIQUE,
  verification_status text NOT NULL DEFAULT 'PENDING',
  verification_token_hash text NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS identity.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keycloak_subject text NOT NULL UNIQUE,
  email text NOT NULL,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS identity.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES identity.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  managed boolean NOT NULL DEFAULT false,
  UNIQUE (tenant_id, key)
);

CREATE UNIQUE INDEX IF NOT EXISTS roles_global_key_idx
  ON identity.roles(key)
  WHERE tenant_id IS NULL;

CREATE TABLE IF NOT EXISTS identity.permissions (
  key text PRIMARY KEY,
  module text NOT NULL,
  action text NOT NULL,
  description text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS identity.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES identity.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES identity.roles(id),
  status identity.membership_status NOT NULL DEFAULT 'INVITED',
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  invited_by uuid REFERENCES identity.users(id) ON DELETE SET NULL,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS identity.role_permissions (
  role_id uuid NOT NULL REFERENCES identity.roles(id) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES identity.permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_key)
);

CREATE TABLE IF NOT EXISTS identity.membership_permissions (
  membership_id uuid NOT NULL REFERENCES identity.memberships(id) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES identity.permissions(key) ON DELETE CASCADE,
  effect identity.policy_effect NOT NULL,
  PRIMARY KEY (membership_id, permission_key)
);

CREATE TABLE IF NOT EXISTS identity.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES identity.tenants(id) ON DELETE CASCADE,
  client_id text NOT NULL UNIQUE,
  client_secret_hash text,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'PUBLIC',
  redirect_uris jsonb NOT NULL DEFAULT '[]'::jsonb,
  allowed_origins jsonb NOT NULL DEFAULT '[]'::jsonb,
  scopes jsonb NOT NULL DEFAULT '["openid", "profile", "email"]'::jsonb,
  status identity.application_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS identity.identity_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES identity.tenants(id) ON DELETE CASCADE,
  type identity.idp_type NOT NULL,
  alias text NOT NULL,
  display_name text NOT NULL,
  secret_ref text,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, alias)
);

CREATE TABLE IF NOT EXISTS identity.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES identity.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  role_id uuid NOT NULL REFERENCES identity.roles(id),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS identity.policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES identity.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  effect identity.policy_effect NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS identity.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES identity.tenants(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES identity.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  outcome text NOT NULL,
  request_id text,
  ip_hash text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS identity.outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES identity.tenants(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id text NOT NULL,
  payload jsonb NOT NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenants_status_idx ON identity.tenants(status);
CREATE INDEX IF NOT EXISTS memberships_tenant_status_idx ON identity.memberships(tenant_id, status);
CREATE INDEX IF NOT EXISTS memberships_user_status_idx ON identity.memberships(user_id, status);
CREATE INDEX IF NOT EXISTS audit_events_tenant_created_idx ON identity.audit_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS outbox_unpublished_idx ON identity.outbox_events(created_at) WHERE published_at IS NULL;

ALTER TABLE identity.tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.membership_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.identity_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.outbox_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION identity.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$ SELECT nullif(current_setting('app.tenant_id', true), '')::uuid $$;

CREATE POLICY tenant_domains_isolation ON identity.tenant_domains
  USING (tenant_id = identity.current_tenant_id())
  WITH CHECK (tenant_id = identity.current_tenant_id());

CREATE POLICY roles_isolation ON identity.roles
  USING (
    tenant_id IS NULL OR tenant_id = identity.current_tenant_id()
  )
  WITH CHECK (tenant_id = identity.current_tenant_id());

CREATE POLICY role_permissions_isolation ON identity.role_permissions
  USING (
    EXISTS (
      SELECT 1 FROM identity.roles role
      WHERE role.id = role_permissions.role_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM identity.roles role
      WHERE role.id = role_permissions.role_id
    )
  );

CREATE POLICY memberships_isolation ON identity.memberships
  USING (tenant_id = identity.current_tenant_id())
  WITH CHECK (tenant_id = identity.current_tenant_id());

CREATE POLICY membership_permissions_isolation ON identity.membership_permissions
  USING (
    EXISTS (
      SELECT 1 FROM identity.memberships membership
      WHERE membership.id = membership_permissions.membership_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM identity.memberships membership
      WHERE membership.id = membership_permissions.membership_id
    )
  );

CREATE POLICY applications_isolation ON identity.applications
  USING (tenant_id = identity.current_tenant_id())
  WITH CHECK (tenant_id = identity.current_tenant_id());

CREATE POLICY identity_providers_isolation ON identity.identity_providers
  USING (tenant_id = identity.current_tenant_id())
  WITH CHECK (tenant_id = identity.current_tenant_id());

CREATE POLICY invitations_isolation ON identity.invitations
  USING (tenant_id = identity.current_tenant_id())
  WITH CHECK (tenant_id = identity.current_tenant_id());

CREATE POLICY policies_isolation ON identity.policies
  USING (tenant_id = identity.current_tenant_id())
  WITH CHECK (tenant_id = identity.current_tenant_id());

CREATE POLICY audit_events_isolation ON identity.audit_events
  USING (tenant_id = identity.current_tenant_id())
  WITH CHECK (tenant_id = identity.current_tenant_id());

CREATE POLICY outbox_events_isolation ON identity.outbox_events
  USING (tenant_id = identity.current_tenant_id())
  WITH CHECK (tenant_id = identity.current_tenant_id());

INSERT INTO identity.permissions (key, module, action, description) VALUES
  ('USER_CREATE', 'users', 'create', 'Create tenant users'),
  ('USER_READ', 'users', 'read', 'View tenant users'),
  ('USER_UPDATE', 'users', 'update', 'Update tenant users'),
  ('USER_DELETE', 'users', 'delete', 'Remove tenant users'),
  ('ROLE_MANAGE', 'roles', 'manage', 'Assign and change tenant roles'),
  ('REPORT_VIEW', 'reports', 'view', 'View tenant reports'),
  ('IDP_CONFIGURE', 'identity_providers', 'configure', 'Configure tenant identity providers'),
  ('APPLICATION_MANAGE', 'applications', 'manage', 'Manage tenant applications'),
  ('AUDIT_VIEW', 'audit', 'read', 'View tenant audit events'),
  ('POLICY_MANAGE', 'policies', 'manage', 'Manage tenant authorization policies')
ON CONFLICT (key) DO NOTHING;

INSERT INTO identity.roles (tenant_id, key, name, managed)
SELECT NULL, defaults.key, defaults.name, true
FROM (VALUES
  ('ADMIN', 'Admin'),
  ('MANAGER', 'Manager'),
  ('EMPLOYEE', 'Employee')
) AS defaults(key, name)
WHERE NOT EXISTS (
  SELECT 1
  FROM identity.roles existing
  WHERE existing.tenant_id IS NULL AND existing.key = defaults.key
);

INSERT INTO identity.role_permissions (role_id, permission_key)
SELECT r.id, p.key
FROM identity.roles r
JOIN identity.permissions p ON (
  (r.key = 'ADMIN') OR
  (r.key = 'MANAGER' AND p.key IN ('USER_CREATE', 'USER_READ', 'USER_UPDATE', 'REPORT_VIEW')) OR
  (r.key = 'EMPLOYEE' AND p.key IN ('REPORT_VIEW'))
)
ON CONFLICT DO NOTHING;
