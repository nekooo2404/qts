import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { messageResponse } from '@/lib/http/response'
import { resourceOrganizationFilter } from '@/server/repositories/portal'

export async function GET(
  _request: Request,
  context: RouteContext<'/api/portal/contracts/[id]/download'>,
) {
  const user = await getCurrentUser()
  if (!user) return messageResponse('Phiên đăng nhập đã hết hạn.', 401)
  const { id } = await context.params
  const contract = await db.contract.findFirst({
    where: { id, ...resourceOrganizationFilter(user) },
    include: { organization: { select: { name: true } } },
  })
  if (!contract)
    return messageResponse(
      'Không tìm thấy hợp đồng hoặc bạn không có quyền tải xuống.',
      404,
    )
  const content = `QTS TECHNOLOGY - HỢP ĐỒNG DEMO\n\nSố: ${contract.code}\nTiêu đề: ${contract.title}\nTổ chức: ${contract.organization.name}\nTrạng thái: ${contract.status}\n\nĐây là tệp minh họa, không có giá trị pháp lý.`
  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${contract.code}.txt"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
