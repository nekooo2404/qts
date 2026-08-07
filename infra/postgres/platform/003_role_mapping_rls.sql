ALTER TABLE identity.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.membership_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_isolation ON identity.roles;
CREATE POLICY roles_isolation ON identity.roles
  USING (
    tenant_id IS NULL OR tenant_id = identity.current_tenant_id()
  )
  WITH CHECK (tenant_id = identity.current_tenant_id());

DROP POLICY IF EXISTS role_permissions_isolation ON identity.role_permissions;
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

DROP POLICY IF EXISTS membership_permissions_isolation ON identity.membership_permissions;
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
