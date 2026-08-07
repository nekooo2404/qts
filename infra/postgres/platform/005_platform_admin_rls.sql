-- Platform-admin queries still run through the application role. The backend
-- sets this transaction-local flag only after verifying a Keycloak role.
CREATE OR REPLACE FUNCTION identity.platform_admin_scope()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$ SELECT current_setting('app.platform_admin', true) = 'true' $$;

DROP POLICY IF EXISTS audit_events_isolation ON identity.audit_events;
CREATE POLICY audit_events_isolation ON identity.audit_events
  USING (identity.platform_admin_scope() OR tenant_id = identity.current_tenant_id())
  WITH CHECK (identity.platform_admin_scope() OR tenant_id = identity.current_tenant_id());

DROP POLICY IF EXISTS outbox_events_isolation ON identity.outbox_events;
CREATE POLICY outbox_events_isolation ON identity.outbox_events
  USING (identity.platform_admin_scope() OR tenant_id = identity.current_tenant_id())
  WITH CHECK (identity.platform_admin_scope() OR tenant_id = identity.current_tenant_id());
