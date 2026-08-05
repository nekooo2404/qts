import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { statusLabels } from '@/config/portal'
import { recordAudit } from '@/lib/audit'
import { authorizeMutation } from '@/lib/auth/api'
import { canTransitionTicket } from '@/lib/domain/ticket-workflow'
import { db } from '@/lib/db'
import {
  messageResponse,
  readJsonBody,
  RequestBodyError,
  validationErrorResponse,
} from '@/lib/http/response'
import { ticketScope } from '@/server/repositories/portal'
import { ticketStatusSchema } from '@/lib/validation/forms'

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/portal/tickets/[id]/status'>,
) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  const { id } = await context.params

  try {
    const ticket = await db.ticket.findFirst({
      where: { AND: [ticketScope(auth.user), { id }] },
      select: {
        id: true,
        code: true,
        status: true,
        assignedToId: true,
        createdById: true,
      },
    })
    if (!ticket)
      return messageResponse(
        'Không tìm thấy ticket hoặc bạn không có quyền truy cập.',
        404,
      )
    const result = ticketStatusSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)

    const statusChanged = result.data.status !== ticket.status
    const assigneeChanged =
      result.data.assignedToId !== undefined &&
      result.data.assignedToId !== ticket.assignedToId
    if (
      statusChanged &&
      !canTransitionTicket(auth.user.role, ticket.status, result.data.status)
    ) {
      return messageResponse(
        'Không thể chuyển ticket sang trạng thái đã chọn.',
        409,
      )
    }
    if (!statusChanged && !assigneeChanged)
      return messageResponse('Ticket chưa có thay đổi.', 409)
    if (assigneeChanged && auth.user.role === 'CUSTOMER')
      return messageResponse('Bạn không có quyền gán người xử lý.', 403)

    if (result.data.assignedToId) {
      const assignee = await db.user.findFirst({
        where: {
          id: result.data.assignedToId,
          active: true,
          role: { name: { in: ['ADMIN', 'STAFF'] } },
        },
        select: { id: true },
      })
      if (!assignee) return messageResponse('Người xử lý không hợp lệ.', 422)
    }

    await db.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id },
        data: {
          status: result.data.status,
          ...(result.data.assignedToId !== undefined
            ? { assignedToId: result.data.assignedToId || null }
            : {}),
        },
      })
      if (statusChanged) {
        await tx.ticketMessage.create({
          data: {
            ticketId: id,
            authorId: auth.user.id,
            content: `Đã chuyển trạng thái từ “${statusLabels[ticket.status]}” sang “${statusLabels[result.data.status]}”.`,
          },
        })
      }
      if (ticket.createdById !== auth.user.id) {
        await tx.notification.create({
          data: {
            userId: ticket.createdById,
            title: `${ticket.code} đã được cập nhật`,
            message: statusChanged
              ? `Trạng thái mới: ${statusLabels[result.data.status]}.`
              : 'Người xử lý đã được cập nhật.',
            type:
              statusChanged && result.data.status === 'RESOLVED'
                ? 'SUCCESS'
                : 'INFO',
            href: `/portal/tickets/${id}`,
          },
        })
      }
    })

    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'UPDATE_TICKET_STATUS',
      entity: 'Ticket',
      entityId: id,
      metadata: {
        from: ticket.status,
        to: result.data.status,
        assignedToId: result.data.assignedToId ?? null,
      },
    })
    revalidatePath(`/portal/tickets/${id}`)
    revalidatePath('/portal/tickets')
    return NextResponse.json({ ok: true, message: 'Đã cập nhật ticket.' })
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    console.error('Không thể cập nhật ticket.', error)
    return messageResponse('Không thể cập nhật ticket lúc này.', 500)
  }
}
