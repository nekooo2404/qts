import type { Metadata } from 'next'
import Link from 'next/link'
import { Download, ReceiptText } from 'lucide-react'

import { DataTable } from '@client/components/portal/data-table'
import { EmptyState } from '@client/components/portal/empty-state'
import { PortalPageHeader } from '@client/components/portal/portal-page-header'
import { StatusBadge } from '@client/components/portal/status-badge'
import { requirePortalUser } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/utils'
import { resourceOrganizationFilter } from '@/server/repositories/portal'

export const metadata: Metadata = { title: 'Hóa đơn' }

export default async function PortalInvoicesPage() {
  const user = await requirePortalUser()
  const canDownloadInvoices = hasPermission(user, 'portal.invoices.download')
  const invoices = await db.invoice.findMany({
    where: resourceOrganizationFilter(user, 'invoices'),
    include: {
      organization: { select: { name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'desc' },
  })
  return (
    <div className="portal-page">
      <PortalPageHeader
        eyebrow="Billing records"
        title="Hóa đơn"
        description="Theo dõi kỳ thanh toán, hạn và trạng thái. Các số tiền trong bản demo không phải dữ liệu tài chính thật."
      />
      {!invoices.length ? (
        <EmptyState
          icon={ReceiptText}
          title="Chưa có hóa đơn"
          description="Hóa đơn thuộc tổ chức của bạn sẽ xuất hiện tại đây."
        />
      ) : (
        <DataTable
          label="Danh sách hóa đơn"
          mobileCards={invoices.map((invoice) => (
            <article className="data-mobile-card" key={invoice.id}>
              <span>{invoice.code}</span>
              <strong>{invoice.title}</strong>
              <span>
                {formatCurrency(invoice.amount, invoice.currency)} · Hạn{' '}
                {formatDate(invoice.dueDate)}
              </span>
              <StatusBadge status={invoice.status} />
              {canDownloadInvoices ? (
                <a href={`/api/portal/invoices/${invoice.id}/download`}>
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
              <th>Số hóa đơn</th>
              <th>Kỳ thanh toán</th>
              <th>Dự án</th>
              <th>Số tiền</th>
              <th>Ngày phát hành</th>
              <th>Hạn thanh toán</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="table-primary">{invoice.code}</td>
                <td>{invoice.title}</td>
                <td>
                  {invoice.project ? (
                    <Link href={`/portal/projects/${invoice.project.id}`}>
                      {invoice.project.name}
                    </Link>
                  ) : (
                    invoice.organization.name
                  )}
                </td>
                <td>{formatCurrency(invoice.amount, invoice.currency)}</td>
                <td>{formatDate(invoice.createdAt)}</td>
                <td>{formatDate(invoice.dueDate)}</td>
                <td>
                  <StatusBadge status={invoice.status} />
                </td>
                <td>
                  {canDownloadInvoices ? (
                    <a
                      className="icon-link"
                      href={`/api/portal/invoices/${invoice.id}/download`}
                      aria-label={`Tải ${invoice.code}`}
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
        Dữ liệu hóa đơn và tệp tải xuống chỉ là mẫu minh họa trong môi trường
        development.
      </p>
    </div>
  )
}
