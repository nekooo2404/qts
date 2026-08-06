import { randomInt } from 'node:crypto'
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
import { projectScope } from '@/server/repositories/portal'
import { ticketSchema } from '@/lib/validation/forms'

function newTicketCode() {
  const year = new Date().getFullYear()
  return `TK-${year}-${Date.now().toString().slice(-6)}${randomInt(10, 99)}`
}

export async function POST(request: Request) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (!hasPermission(auth.user, 'portal.tickets.create'))
    return messageResponse('Không có quyền tạo ticket.', 403)

  try {
    const result = ticketSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)

    const project = result.data.projectId
      ? await db.project.findFirst({
          where: {
            AND: [projectScope(auth.user), { id: result.data.projectId }],
          },
          select: { id: true, organizationId: true },
        })
      : null
    if (result.data.projectId && !project) {
      return messageResponse(
        'Dự án không tồn tại hoặc nằm ngoài phạm vi của bạn.',
        404,
      )
    }

    const organizationId =
      auth.user.role === 'CUSTOMER'
        ? auth.user.organizationId
        : (project?.organizationId ?? auth.user.organizationId)
    if (!organizationId)
      return messageResponse('Tài khoản chưa thuộc tổ chức nào.', 422)
    if (
      auth.user.role === 'CUSTOMER' &&
      project?.organizationId !== undefined &&
      project.organizationId !== organizationId
    ) {
      return messageResponse('Dự án không thuộc tổ chức của bạn.', 403)
    }

    const support = await db.user.findFirst({
      where: {
        active: true,
        role: { name: 'STAFF' },
        ...(project
          ? { projectMemberships: { some: { projectId: project.id } } }
          : {}),
      },
      select: { id: true },
    })

    const ticket = await db.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          code: newTicketCode(),
          subject: result.data.subject,
          description: result.data.description,
          category: result.data.category,
          priority: result.data.priority,
          organizationId,
          projectId: project?.id ?? null,
          createdById: auth.user.id,
          assignedToId: support?.id ?? null,
        },
        select: { id: true, code: true },
      })
      await tx.ticketMessage.create({
        data: {
          ticketId: created.id,
          authorId: auth.user.id,
          content: result.data.description,
        },
      })
      if (support && support.id !== auth.user.id) {
        await tx.notification.create({
          data: {
            userId: support.id,
            title: `Ticket mới ${created.code}`,
            message: result.data.subject,
            type:
              result.data.priority === 'URGENT' ? 'ACTION_REQUIRED' : 'INFO',
            href: `/portal/tickets/${created.id}`,
          },
        })
      }
      return created
    })

    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'CREATE_TICKET',
      entity: 'Ticket',
      entityId: ticket.id,
    })
    revalidatePath('/portal/tickets')
    return NextResponse.json(
      { ok: true, message: `Đã tạo ticket ${ticket.code}.`, data: ticket },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    console.error('Không thể tạo ticket.', error)
    return messageResponse('Không thể tạo ticket lúc này.', 500)
  }
}
