import type { Metadata } from 'next'

import { PortalPageHeader } from '@/components/portal/portal-page-header'
import { SettingsPanel } from '@/components/portal/settings-panel'
import { requirePortalUser } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/domain/permissions'

export const metadata: Metadata = { title: 'Cài đặt' }

export default async function PortalSettingsPage() {
  const user = await requirePortalUser()
  return (
    <div className="portal-page">
      <PortalPageHeader
        eyebrow="Preferences"
        title="Cài đặt"
        description="Điều chỉnh thông báo và trải nghiệm hiển thị cho thiết bị hiện tại."
      />
      <SettingsPanel
        canUpdate={hasPermission(user, 'portal.settings.update')}
      />
    </div>
  )
}
