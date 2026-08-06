import type { Metadata } from 'next'
import { Download, FileText, Search } from 'lucide-react'

import { DataTable } from '@/components/portal/data-table'
import { EmptyState } from '@/components/portal/empty-state'
import { FileUploader } from '@/components/portal/file-uploader'
import { PortalPageHeader } from '@/components/portal/portal-page-header'
import { buttonVariants } from '@/components/ui/button'
import { requirePortalUser } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import { cn, formatDate, formatFileSize } from '@/lib/utils'
import {
  projectScope,
  resourceOrganizationFilter,
} from '@/server/repositories/portal'

export const metadata: Metadata = { title: 'Tài liệu' }

export default async function PortalDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requirePortalUser()
  const canDownloadDocuments = hasPermission(user, 'portal.documents.download')
  const canUploadToAllOrganizations = hasPermission(
    user,
    'portal.documents.upload.all',
  )
  const raw = await searchParams
  const q = typeof raw.q === 'string' ? raw.q.trim().slice(0, 100) : ''
  const [documents, organizations, projects] = await Promise.all([
    db.document.findMany({
      where: {
        ...resourceOrganizationFilter(user, 'documents'),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { fileName: { contains: q } },
                { project: { name: { contains: q } } },
              ],
            }
          : {}),
      },
      include: {
        organization: { select: { name: true } },
        project: { select: { name: true } },
        uploadedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    hasPermission(user, 'portal.documents.upload')
      ? db.organization.findMany({
          where: canUploadToAllOrganizations
            ? {}
            : { id: user.organizationId ?? '__no_organization__' },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
    hasPermission(user, 'portal.documents.upload')
      ? db.project.findMany({
          where: projectScope(user),
          select: { id: true, name: true, organizationId: true },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
  ])
  return (
    <div className="portal-page">
      <PortalPageHeader
        eyebrow="Shared resources"
        title="Tài liệu"
        description="Tài liệu dự án được giới hạn theo tổ chức và có kiểm quyền khi tải xuống."
      />
      <form className="portal-toolbar" method="get">
        <label className="portal-toolbar__search">
          <Search size={17} />
          <span className="sr-only">Tìm tài liệu</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Tên tệp, loại hoặc dự án"
          />
        </label>
        <button
          className={cn(
            buttonVariants({ variant: 'secondary', size: 'small' }),
          )}
          type="submit"
        >
          Tìm kiếm
        </button>
      </form>
      {!documents.length ? (
        <EmptyState
          icon={FileText}
          title="Chưa có tài liệu"
          description="Tài liệu được chia sẻ cho tổ chức hoặc dự án của bạn sẽ xuất hiện tại đây."
        />
      ) : (
        <DataTable
          label="Danh sách tài liệu"
          mobileCards={documents.map((document) => (
            <article className="data-mobile-card" key={document.id}>
              <strong>{document.name}</strong>
              <span>
                {document.fileName} · {formatFileSize(document.size)}
              </span>
              <span>
                {document.project?.name ?? document.organization.name}
              </span>
              {canDownloadDocuments ? (
                <a
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'small' }),
                  )}
                  href={`/api/portal/documents/${document.id}/download`}
                >
                  <Download size={15} /> Tải bản demo
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
              <th>Tài liệu</th>
              <th>Loại</th>
              <th>Dự án</th>
              <th>Kích thước</th>
              <th>Người tải lên</th>
              <th>Ngày cập nhật</th>
              <th>Quyền truy cập</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id}>
                <td className="table-primary">
                  {document.name}
                  <small>{document.fileName}</small>
                </td>
                <td>{document.type}</td>
                <td>{document.project?.name ?? 'Dùng chung tổ chức'}</td>
                <td>{formatFileSize(document.size)}</td>
                <td>{document.uploadedBy.name}</td>
                <td>{formatDate(document.createdAt)}</td>
                <td>{document.organization.name}</td>
                <td>
                  {canDownloadDocuments ? (
                    <a
                      className="icon-link"
                      href={`/api/portal/documents/${document.id}/download`}
                      aria-label={`Tải ${document.name}`}
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
      {hasPermission(user, 'portal.documents.upload') && (
        <details className="portal-panel portal-create-panel">
          <summary>Upload tài liệu demo</summary>
          <div className="portal-create-panel__body">
            <FileUploader organizations={organizations} projects={projects} />
          </div>
        </details>
      )}
    </div>
  )
}
