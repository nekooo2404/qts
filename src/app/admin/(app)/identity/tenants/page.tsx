import type { Metadata } from 'next'

import { IdentityTenantConsole } from '@/components/admin/identity-tenant-console'
import { PortalPageHeader } from '@client/components/portal/portal-page-header'

export const metadata: Metadata = {
  title: 'Identity tenants',
}

export default function IdentityTenantsPage() {
  return (
    <div className="portal-page identity-console">
      <PortalPageHeader
        eyebrow="Identity platform"
        title="Tenant management"
        description="Provision customer organizations, lifecycle status and tenant branding from the platform control plane."
      />
      <IdentityTenantConsole />
    </div>
  )
}
