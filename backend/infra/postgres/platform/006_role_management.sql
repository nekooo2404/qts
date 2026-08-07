-- Role changes are a privileged tenant operation. Keep this migration
-- idempotent so existing shared-database installations receive the permission.
INSERT INTO identity.permissions (key, module, action, description)
VALUES ('ROLE_MANAGE', 'roles', 'manage', 'Assign and change tenant roles')
ON CONFLICT (key) DO UPDATE SET
  module = EXCLUDED.module,
  action = EXCLUDED.action,
  description = EXCLUDED.description;

INSERT INTO identity.role_permissions (role_id, permission_key)
SELECT role.id, 'ROLE_MANAGE'
FROM identity.roles role
WHERE role.key = 'ADMIN'
ON CONFLICT DO NOTHING;
