import type { Metadata } from 'next'
import { Building2, Mail, ShieldCheck } from 'lucide-react'

import { PasswordForm } from '@/components/portal/password-form'
import { PortalPageHeader } from '@/components/portal/portal-page-header'
import { ProfileForm } from '@/components/portal/profile-form'
import { roleLabels } from '@/config/portal'
import { requirePortalUser } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/domain/permissions'

export const metadata: Metadata = { title: 'Hồ sơ' }

export default async function PortalProfilePage() {
  const user = await requirePortalUser()
  const canUpdateProfile = hasPermission(user, 'portal.profile.update')
  return (
    <div className="portal-page">
      <PortalPageHeader
        eyebrow="Account"
        title="Hồ sơ cá nhân"
        description="Cập nhật thông tin liên hệ; email, vai trò và tổ chức do quản trị viên kiểm soát."
      />
      <div className="profile-layout">
        <aside className="portal-panel profile-summary">
          <div className="profile-summary__avatar">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <h2>{user.name}</h2>
          <p>{user.title ?? 'Chưa cập nhật chức vụ'}</p>
          <dl>
            <div>
              <dt>
                <Mail size={15} /> Email
              </dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>
                <Building2 size={15} /> Tổ chức
              </dt>
              <dd>{user.organizationName ?? 'Chưa gắn tổ chức'}</dd>
            </div>
            <div>
              <dt>
                <ShieldCheck size={15} /> Vai trò
              </dt>
              <dd>{roleLabels[user.role]}</dd>
            </div>
          </dl>
          <small>
            Avatar hiện dùng chữ cái đại diện. Có thể thay bằng URL ảnh sau khi
            cấu hình storage production.
          </small>
        </aside>
        <div className="profile-content">
          <section className="portal-panel">
            <header className="portal-panel__header">
              <div>
                <h2>Thông tin cá nhân</h2>
                <p>Các trường có thể tự cập nhật.</p>
              </div>
            </header>
            <ProfileForm
              canUpdate={canUpdateProfile}
              defaultValues={{
                name: user.name,
                phone: user.phone ?? '',
                title: user.title ?? '',
              }}
            />
          </section>
          <section className="portal-panel">
            <header className="portal-panel__header">
              <div>
                <h2>Đổi mật khẩu</h2>
                <p>Tất cả phiên đăng nhập sẽ bị thu hồi sau khi đổi.</p>
              </div>
            </header>
            <PasswordForm canUpdate={canUpdateProfile} />
          </section>
        </div>
      </div>
    </div>
  )
}
