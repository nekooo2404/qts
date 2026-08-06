import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { recordAudit } from '@/lib/audit'
import { authorizeMutation } from '@/lib/auth/api'
import { hasPermission } from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import {
  messageResponse,
  readJsonBody,
  RequestBodyError,
  validationErrorResponse,
} from '@/lib/http/response'
import { userAdminSchema } from '@/lib/validation/forms'
import {
  hasActivePermissionManager,
  LastPermissionManagerError,
} from '@/server/admin/permission-invariants'

class TargetUserNotFoundError extends Error {}
class InvalidRoleError extends Error {}
class SelfRoleChangeError extends Error {}
class RoleAssignmentPermissionError extends Error {}

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/portal/admin/users/[id]'>,
) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (!hasPermission(auth.user, 'admin.users.update'))
    return messageResponse('Bạn không có quyền quản lý người dùng.', 403)
  const { id } = await context.params
  try {
    const result = userAdminSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)
    if (id === auth.user.id && !result.data.active)
      return messageResponse(
        'Bạn không thể tự vô hiệu hóa tài khoản đang sử dụng.',
        409,
      )

    await db.$transaction(
      async (tx) => {
        const target = await tx.user.findUnique({
          where: { id },
          select: { id: true, active: true, role: { select: { name: true } } },
        })
        if (!target) throw new TargetUserNotFoundError()
        if (
          result.data.role !== target.role.name &&
          !hasPermission(auth.user, 'admin.permissions.manage')
        ) {
          throw new RoleAssignmentPermissionError()
        }
        if (id === auth.user.id && result.data.role !== target.role.name) {
          throw new SelfRoleChangeError()
        }

        const role = await tx.role.findUnique({
          where: { name: result.data.role },
          select: { id: true },
        })
        if (!role) throw new InvalidRoleError()

        const managerRemains = await hasActivePermissionManager(tx, {
          userId: id,
          active: result.data.active,
          role: result.data.role,
        })
        if (!managerRemains) throw new LastPermissionManagerError()

        await tx.user.update({
          where: { id },
          data: { roleId: role.id, active: result.data.active },
        })
        if (!result.data.active) {
          await tx.session.deleteMany({ where: { userId: id } })
        }
      },
      { isolationLevel: 'Serializable' },
    )
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
    if (error instanceof TargetUserNotFoundError)
      return messageResponse('Không tìm thấy người dùng.', 404)
    if (error instanceof InvalidRoleError)
      return messageResponse('Vai trò không tồn tại.', 422)
    if (error instanceof SelfRoleChangeError)
      return messageResponse(
        'Bạn không thể tự thay đổi vai trò nền của tài khoản đang sử dụng.',
        409,
      )
    if (error instanceof RoleAssignmentPermissionError)
      return messageResponse(
        'Chỉ người quản lý phân quyền mới được gán vai trò nền.',
        403,
      )
    if (error instanceof LastPermissionManagerError)
      return messageResponse(
        'Hệ thống phải còn ít nhất một người có quyền quản lý phân quyền.',
        409,
      )
    console.error('Không thể cập nhật người dùng.', error)
    return messageResponse('Không thể cập nhật người dùng lúc này.', 500)
  }
}
