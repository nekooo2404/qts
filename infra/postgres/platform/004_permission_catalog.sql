-- Idempotent permission catalog extension for installations initialized before
-- the Identity Platform permission set was expanded.
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
ON CONFLICT (key) DO UPDATE SET
  module = EXCLUDED.module,
  action = EXCLUDED.action,
  description = EXCLUDED.description;

INSERT INTO identity.role_permissions (role_id, permission_key)
SELECT role.id, permission.key
FROM identity.roles role
CROSS JOIN identity.permissions permission
WHERE role.tenant_id IS NULL
  AND role.key = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO identity.role_permissions (role_id, permission_key)
SELECT role.id, permission.key
FROM identity.roles role
CROSS JOIN identity.permissions permission
WHERE role.tenant_id IS NULL
  AND role.key = 'MANAGER'
  AND permission.key IN ('USER_CREATE', 'USER_READ', 'USER_UPDATE', 'REPORT_VIEW')
ON CONFLICT DO NOTHING;

-- Existing tenant roles receive the same managed baseline as newly-created tenants.
INSERT INTO identity.role_permissions (role_id, permission_key)
SELECT role.id, permission.key
FROM identity.roles role
CROSS JOIN identity.permissions permission
WHERE role.key = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO identity.role_permissions (role_id, permission_key)
SELECT role.id, permission.key
FROM identity.roles role
CROSS JOIN identity.permissions permission
WHERE role.key = 'MANAGER'
  AND permission.key IN ('USER_CREATE', 'USER_READ', 'USER_UPDATE', 'REPORT_VIEW')
ON CONFLICT DO NOTHING;
