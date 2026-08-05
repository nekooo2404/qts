import type { Metadata } from 'next'

import { DataTable } from '@/components/portal/data-table'
import { PortalPageHeader } from '@/components/portal/portal-page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { UserAccessForm } from '@/components/portal/user-access-form'
import { roleLabels } from '@/config/portal'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Quản lý người dùng' }

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    include: {
      role: { select: { name: true } },
      organization: { select: { name: true } },
    },
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
  })
  return (
    <div className="portal-page">
      <PortalPageHeader
        eyebrow="Identity & access"
        title="Người dùng"
        description="Quản lý vai trò và trạng thái tài khoản. Server luôn giữ ít nhất một ADMIN hoạt động."
      />
      <DataTable
        label="Danh sách người dùng"
        mobileCards={users.map((user) => (
          <article className="data-mobile-card" key={user.id}>
            <strong>{user.name}</strong>
            <span>
              {user.email} · {user.organization?.name ?? 'Chưa có tổ chức'}
            </span>
            <StatusBadge status={user.active ? 'ACTIVE' : 'CANCELLED'} />
            <UserAccessForm
              id={user.id}
              role={user.role.name}
              active={user.active}
            />
          </article>
        ))}
      >
        <thead>
          <tr>
            <th>Người dùng</th>
            <th>Tổ chức</th>
            <th>Vai trò hiện tại</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th>Cập nhật quyền</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="table-primary">
                {user.name}
                <small>{user.email}</small>
              </td>
              <td>{user.organization?.name ?? 'Chưa gắn tổ chức'}</td>
              <td>{roleLabels[user.role.name]}</td>
              <td>
                <StatusBadge status={user.active ? 'ACTIVE' : 'CANCELLED'} />
              </td>
              <td>{formatDate(user.createdAt)}</td>
              <td>
                <UserAccessForm
                  id={user.id}
                  role={user.role.name}
                  active={user.active}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  )
}
