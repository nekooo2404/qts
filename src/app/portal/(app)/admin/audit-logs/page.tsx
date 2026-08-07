import type { Metadata } from 'next'
import { ScrollText } from 'lucide-react'

import { DataTable } from '@client/components/portal/data-table'
import { PortalPageHeader } from '@client/components/portal/portal-page-header'
import { db } from '@/lib/db'
import { formatDateTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'Nhật ký kiểm toán' }

export default async function AdminAuditLogsPage() {
  const logs = await db.auditLog.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return (
    <div className="portal-page">
      <PortalPageHeader
        eyebrow="Security trail"
        title="Nhật ký kiểm toán"
        description="200 sự kiện gần nhất cho đăng nhập, thay đổi quyền và các thao tác quản trị quan trọng."
      />
      <section className="portal-panel audit-note">
        <ScrollText size={20} />
        <p>
          Metadata không chứa mật khẩu hoặc token. Địa chỉ IP chỉ được lưu dưới
          dạng hash khi route cung cấp request context.
        </p>
      </section>
      <DataTable
        label="Nhật ký kiểm toán"
        mobileCards={logs.map((log) => (
          <article className="data-mobile-card" key={log.id}>
            <strong>{log.action}</strong>
            <span>
              {log.entity}
              {log.entityId ? ` · ${log.entityId}` : ''}
            </span>
            <span>
              {log.user?.name ?? 'Hệ thống'} · {formatDateTime(log.createdAt)}
            </span>
          </article>
        ))}
      >
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Hành động</th>
            <th>Đối tượng</th>
            <th>ID</th>
            <th>Người thực hiện</th>
            <th>IP hash</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{formatDateTime(log.createdAt)}</td>
              <td className="table-primary">{log.action}</td>
              <td>{log.entity}</td>
              <td>{log.entityId ?? '—'}</td>
              <td>
                {log.user ? (
                  <>
                    {log.user.name}
                    <small className="table-secondary">{log.user.email}</small>
                  </>
                ) : (
                  'Hệ thống / công khai'
                )}
              </td>
              <td className="audit-hash">
                {log.ipHash ? `${log.ipHash.slice(0, 12)}...` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  )
}
