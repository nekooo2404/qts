import type { Metadata } from 'next'

import { IdentityTenantDetailConsole } from '@admin/components/admin/identity-tenant-detail-console'
import { PortalPageHeader } from '@client/components/portal/portal-page-header'

export const metadata: Metadata = {
  title: 'Tenant identity operations',
}

type PageProps = { params: Promise<{ id: string }> }

export default async function IdentityTenantDetailPage({ params }: PageProps) {
  const { id } = await params
  return (
    <div className="portal-page identity-console">
      <PortalPageHeader
        eyebrow="Identity platform"
        title="Tenant operations"
        description="Manage members, applications, federation, policies and the audit trail inside one tenant boundary."
      />
      <IdentityTenantDetailConsole tenantId={id} />
    </div>
  )
}
