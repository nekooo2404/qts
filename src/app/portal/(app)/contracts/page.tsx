import type { Metadata } from 'next'
import Link from 'next/link'
import { Download, FileCheck2 } from 'lucide-react'

import { DataTable } from '@client/components/portal/data-table'
import { EmptyState } from '@client/components/portal/empty-state'
import { PortalPageHeader } from '@client/components/portal/portal-page-header'
import { StatusBadge } from '@client/components/portal/status-badge'
import { requirePortalUser } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/utils'
import { resourceOrganizationFilter } from '@backend/server/repositories/portal'

export const metadata: Metadata = { title: 'Hợp đồng' }

export default async function PortalContractsPage() {
  const user = await requirePortalUser()
  const canDownloadContracts = hasPermission(user, 'portal.contracts.download')
  const contracts = await db.contract.findMany({
    where: resourceOrganizationFilter(user, 'contracts'),
    include: {
      organization: { select: { name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
  return (
    <div className="portal-page">
      <PortalPageHeader
        eyebrow="Commercial records"
        title="Hợp đồng"
        description="Tra cứu trạng thái và tệp hợp đồng theo phạm vi tổ chức. Toàn bộ giá trị hiện là dữ liệu demo."
      />
      {!contracts.length ? (
        <EmptyState
          icon={FileCheck2}
          title="Chưa có hợp đồng"
          description="Hợp đồng được chia sẻ cho tổ chức của bạn sẽ xuất hiện tại đây."
        />
      ) : (
        <DataTable
          label="Danh sách hợp đồng"
          mobileCards={contracts.map((contract) => (
            <article className="data-mobile-card" key={contract.id}>
              <span>{contract.code}</span>
              <strong>{contract.title}</strong>
              <span>
                {contract.project?.name ?? contract.organization.name}
              </span>
              <StatusBadge status={contract.status} />
              {canDownloadContracts ? (
                <a href={`/api/portal/contracts/${contract.id}/download`}>
                  <Download size={15} /> Tải file demo
                </a>
              ) : (
                <span className="data-disclaimer">
                  Không có quyền tải xuống
                </span>
              )}
            </article>
          ))}
        >
          <thead>
            <tr>
              <th>Số hợp đồng</th>
              <th>Dự án</th>
              <th>Khách hàng</th>
              <th>Ngày ký</th>
              <th>Hiệu lực từ</th>
              <th>Hết hạn</th>
              <th>Giá trị</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <tr key={contract.id}>
                <td className="table-primary">
                  {contract.code}
                  <small>{contract.title}</small>
                </td>
                <td>
                  {contract.project ? (
                    <Link href={`/portal/projects/${contract.project.id}`}>
                      {contract.project.name}
                    </Link>
                  ) : (
                    'Không gắn dự án'
                  )}
                </td>
                <td>{contract.organization.name}</td>
                <td>{formatDate(contract.signedAt)}</td>
                <td>{formatDate(contract.signedAt)}</td>
                <td>{formatDate(contract.expiresAt)}</td>
                <td>{formatCurrency(contract.value, contract.currency)}</td>
                <td>
                  <StatusBadge status={contract.status} />
                </td>
                <td>
                  {canDownloadContracts ? (
                    <a
                      className="icon-link"
                      href={`/api/portal/contracts/${contract.id}/download`}
                      aria-label={`Tải ${contract.code}`}
                    >
                      <Download size={17} />
                    </a>
                  ) : (
                    <span className="data-disclaimer">
                      Không có quyền tải xuống
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
      <p className="data-disclaimer">
        Giá trị, ngày hiệu lực và tệp tải xuống trong môi trường local chỉ phục
        vụ minh họa; không có giá trị pháp lý.
      </p>
    </div>
  )
}
