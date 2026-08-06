import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import { messageResponse } from '@/lib/http/response'
import { resourceOrganizationFilter } from '@/server/repositories/portal'

export async function GET(
  _request: Request,
  context: RouteContext<'/api/portal/documents/[id]/download'>,
) {
  const user = await getCurrentUser()
  if (!user) return messageResponse('Phiên đăng nhập đã hết hạn.', 401)
  if (!hasPermission(user, 'portal.documents.download'))
    return messageResponse('Không có quyền tải tài liệu.', 403)
  const { id } = await context.params
  const document = await db.document.findFirst({
    where: { id, ...resourceOrganizationFilter(user, 'documents') },
    select: { name: true, fileName: true, type: true, createdAt: true },
  })
  if (!document)
    return messageResponse(
      'Không tìm thấy tài liệu hoặc bạn không có quyền tải xuống.',
      404,
    )

  const content = `QTS TECHNOLOGY - TÀI LIỆU DEMO\n\nTên: ${document.name}\nLoại: ${document.type}\nNgày tạo: ${document.createdAt.toISOString()}\n\nBản demo chỉ cung cấp tệp văn bản minh họa. Thay bằng storage riêng khi triển khai production.`
  const fileName =
    document.fileName.replace(/[^A-Za-z0-9._-]/g, '-') ||
    'qts-document-demo.txt'
  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName.endsWith('.txt') ? fileName : `${fileName}.txt`}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
