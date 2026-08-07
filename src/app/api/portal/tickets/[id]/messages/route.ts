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
import { findTicketForUser } from '@backend/server/repositories/portal'
import { ticketMessageSchema } from '@/lib/validation/forms'

export async function POST(
  request: Request,
  context: RouteContext<'/api/portal/tickets/[id]/messages'>,
) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (!hasPermission(auth.user, 'portal.tickets.reply'))
    return messageResponse('Không có quyền phản hồi ticket.', 403)
  const { id } = await context.params

  try {
    const ticket = await findTicketForUser(auth.user, id)
    if (!ticket)
      return messageResponse(
        'Không tìm thấy ticket hoặc bạn không có quyền truy cập.',
        404,
      )
    const result = ticketMessageSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)
    if (
      !hasPermission(auth.user, 'portal.tickets.manage') &&
      result.data.internal
    )
      return messageResponse('Khách hàng không thể tạo ghi chú nội bộ.', 403)

    const recipientId = !hasPermission(auth.user, 'portal.tickets.manage')
      ? ticket.assignedTo?.id
      : ticket.createdBy.id
    const message = await db.$transaction(async (tx) => {
      const created = await tx.ticketMessage.create({
        data: {
          ticketId: id,
          authorId: auth.user.id,
          content: result.data.content,
          internal: result.data.internal,
        },
        select: { id: true },
      })
      await tx.ticket.update({ where: { id }, data: { updatedAt: new Date() } })
      if (
        recipientId &&
        recipientId !== auth.user.id &&
        !result.data.internal
      ) {
        await tx.notification.create({
          data: {
            userId: recipientId,
            title: `Phản hồi mới trong ${ticket.code}`,
            message: result.data.content.slice(0, 160),
            type: 'ACTION_REQUIRED',
            href: `/portal/tickets/${id}`,
          },
        })
      }
      return created
    })

    await recordAudit({
      request,
      userId: auth.user.id,
      action: result.data.internal
        ? 'ADD_INTERNAL_TICKET_NOTE'
        : 'REPLY_TICKET',
      entity: 'Ticket',
      entityId: id,
    })
    revalidatePath(`/portal/tickets/${id}`)
    revalidatePath('/portal/tickets')
    return NextResponse.json(
      {
        ok: true,
        message: result.data.internal
          ? 'Đã thêm ghi chú nội bộ.'
          : 'Đã gửi phản hồi.',
        data: message,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    console.error('Không thể phản hồi ticket.', error)
    return messageResponse('Không thể gửi phản hồi lúc này.', 500)
  }
}
