import type { Metadata } from 'next'
import { Megaphone, Plus } from 'lucide-react'

import { AnnouncementForm } from '@client/components/portal/announcement-form'
import { PortalPageHeader } from '@client/components/portal/portal-page-header'
import { requirePortalUser } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import { formatDateTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'Bảng tin' }
const audienceLabels: Record<string, string> = {
  ALL: 'Tất cả',
  STAFF: 'Nhân sự QTS',
  CUSTOMER: 'Khách hàng',
}

export default async function PortalAnnouncementsPage() {
  const user = await requirePortalUser()
  const announcements = await db.announcement.findMany({
    where: {
      active: true,
      OR: [
        { audience: 'ALL' },
        { audience: user.role === 'CUSTOMER' ? 'CUSTOMER' : 'STAFF' },
      ],
    },
    include: { createdBy: { select: { name: true } } },
    orderBy: { publishedAt: 'desc' },
  })
  return (
    <div className="portal-page">
      <PortalPageHeader
        eyebrow="Operations bulletin"
        title="Bảng tin"
        description="Thông tin vận hành được QTS công bố theo đúng nhóm người nhận."
      />
      <div className="announcement-list">
        {announcements.length ? (
          announcements.map((item) => (
            <article key={item.id}>
              <header>
                <div className="announcement-list__icon">
                  <Megaphone size={18} />
                </div>
                <div>
                  <span>{audienceLabels[item.audience]}</span>
                  <h2>{item.title}</h2>
                </div>
                <time>{formatDateTime(item.publishedAt)}</time>
              </header>
              <p>{item.content}</p>
              <footer>Đăng bởi {item.createdBy.name}</footer>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <Megaphone size={28} />
            <h2>Chưa có nội dung bảng tin</h2>
            <p>Thông báo phù hợp với vai trò của bạn sẽ xuất hiện tại đây.</p>
          </div>
        )}
      </div>
      {hasPermission(user, 'portal.announcements.manage') && (
        <details className="portal-panel portal-create-panel">
          <summary>
            <Plus size={18} /> Đăng bảng tin
          </summary>
          <div className="portal-create-panel__body">
            <AnnouncementForm />
          </div>
        </details>
      )}
    </div>
  )
}
