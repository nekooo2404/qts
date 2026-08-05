import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { recordAudit } from '@/lib/audit'
import { authorizeMutation } from '@/lib/auth/api'
import { db } from '@/lib/db'
import {
  messageResponse,
  readJsonBody,
  RequestBodyError,
  validationErrorResponse,
} from '@/lib/http/response'
import { userAdminSchema } from '@/lib/validation/forms'

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/portal/admin/users/[id]'>,
) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (auth.user.role !== 'ADMIN')
    return messageResponse('Bạn không có quyền quản lý người dùng.', 403)
  const { id } = await context.params
  try {
    const target = await db.user.findUnique({
      where: { id },
      include: { role: { select: { name: true } } },
    })
    if (!target) return messageResponse('Không tìm thấy người dùng.', 404)
    const result = userAdminSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)
    if (
      id === auth.user.id &&
      (!result.data.active || result.data.role !== 'ADMIN')
    )
      return messageResponse(
        'Bạn không thể tự vô hiệu hóa hoặc hạ quyền tài khoản đang sử dụng.',
        409,
      )

    if (
      target.role.name === 'ADMIN' &&
      (result.data.role !== 'ADMIN' || !result.data.active)
    ) {
      const activeAdmins = await db.user.count({
        where: { active: true, role: { name: 'ADMIN' } },
      })
      if (activeAdmins <= 1)
        return messageResponse(
          'Hệ thống phải còn ít nhất một quản trị viên đang hoạt động.',
          409,
        )
    }
    const role = await db.role.findUnique({
      where: { name: result.data.role },
      select: { id: true },
    })
    if (!role) return messageResponse('Vai trò không tồn tại.', 422)
    await db.$transaction([
      db.user.update({
        where: { id },
        data: { roleId: role.id, active: result.data.active },
      }),
      ...(!result.data.active
        ? [db.session.deleteMany({ where: { userId: id } })]
        : []),
    ])
    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'UPDATE_USER_ACCESS',
      entity: 'User',
      entityId: id,
      metadata: { role: result.data.role, active: result.data.active },
    })
    revalidatePath('/portal/admin/users')
    return NextResponse.json({
      ok: true,
      message: 'Đã cập nhật quyền người dùng.',
    })
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    console.error('Không thể cập nhật người dùng.', error)
    return messageResponse('Không thể cập nhật người dùng lúc này.', 500)
  }
}
