import { compare, hash } from 'bcryptjs'
import { NextResponse } from 'next/server'

import { recordAudit } from '@/lib/audit'
import { authorizeMutation } from '@/lib/auth/api'
import { db } from '@/lib/db'
import {
  messageResponse,
  readJsonBody,
  RequestBodyError,
  validationErrorResponse,
} from '@/lib/http/response'
import { passwordChangeSchema } from '@/lib/validation/forms'

export async function PATCH(request: Request) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  try {
    const result = passwordChangeSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)
    const user = await db.user.findUnique({
      where: { id: auth.user.id },
      select: { passwordHash: true },
    })
    if (
      !user ||
      !(await compare(result.data.currentPassword, user.passwordHash))
    )
      return messageResponse('Mật khẩu hiện tại không đúng.', 422)
    await db.$transaction([
      db.user.update({
        where: { id: auth.user.id },
        data: { passwordHash: await hash(result.data.newPassword, 12) },
      }),
      db.session.deleteMany({ where: { userId: auth.user.id } }),
    ])
    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'CHANGE_PASSWORD',
      entity: 'User',
      entityId: auth.user.id,
    })
    return NextResponse.json({
      ok: true,
      message: 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.',
      data: { signedOut: true },
    })
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    console.error('Không thể đổi mật khẩu.', error)
    return messageResponse('Không thể đổi mật khẩu lúc này.', 500)
  }
}
