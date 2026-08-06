import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import { messageResponse } from '@/lib/http/response'
import { resourceOrganizationFilter } from '@/server/repositories/portal'

export async function GET(
  _request: Request,
  context: RouteContext<'/api/portal/invoices/[id]/download'>,
) {
  const user = await getCurrentUser()
  if (!user) return messageResponse('Phiên đăng nhập đã hết hạn.', 401)
  if (!hasPermission(user, 'portal.invoices.download'))
    return messageResponse('Không có quyền tải hóa đơn.', 403)
  const { id } = await context.params
  const invoice = await db.invoice.findFirst({
    where: { id, ...resourceOrganizationFilter(user, 'invoices') },
    include: { organization: { select: { name: true } } },
  })
  if (!invoice)
    return messageResponse(
      'Không tìm thấy hóa đơn hoặc bạn không có quyền tải xuống.',
      404,
    )
  const content = `QTS TECHNOLOGY - HÓA ĐƠN DEMO\n\nSố: ${invoice.code}\nKỳ: ${invoice.title}\nTổ chức: ${invoice.organization.name}\nTrạng thái: ${invoice.status}\nGiá trị: [Giá trị demo]\n\nĐây là tệp minh họa, không có giá trị tài chính hoặc pháp lý.`
  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${invoice.code}.txt"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
