import type { Metadata } from 'next'

import { IdentityPlatformAuditConsole } from '@/components/admin/identity-platform-audit-console'
import { PortalPageHeader } from '@client/components/portal/portal-page-header'

export const metadata: Metadata = {
  title: 'Identity audit trail',
}

export default function IdentityAuditPage() {
  return (
    <div className="portal-page identity-console">
      <PortalPageHeader
        eyebrow="Identity platform"
        title="Platform audit trail"
        description="Review tenant, federation, membership and authorization events across the control plane."
      />
      <IdentityPlatformAuditConsole />
    </div>
  )
}
