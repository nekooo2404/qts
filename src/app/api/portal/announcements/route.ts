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
import { announcementSchema } from '@/lib/validation/forms'

export async function POST(request: Request) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (auth.user.role !== 'ADMIN')
    return messageResponse('Chỉ quản trị viên được đăng bảng tin.', 403)
  try {
    const result = announcementSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)
    const announcement = await db.announcement.create({
      data: {
        ...result.data,
        active: true,
        publishedAt: new Date(),
        createdById: auth.user.id,
      },
      select: { id: true },
    })
    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'CREATE_ANNOUNCEMENT',
      entity: 'Announcement',
      entityId: announcement.id,
      metadata: { audience: result.data.audience },
    })
    revalidatePath('/portal/announcements')
    revalidatePath('/portal/dashboard')
    return NextResponse.json(
      {
        ok: true,
        message: 'Đã đăng thông báo trên bảng tin.',
        data: announcement,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    console.error('Không thể đăng bảng tin.', error)
    return messageResponse('Không thể đăng bảng tin lúc này.', 500)
  }
}
