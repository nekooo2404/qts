import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { recordAudit } from '@/lib/audit'
import { authorizeMutation, authorizeRead } from '@/lib/auth/api'
import { hasPermission } from '@/lib/domain/permissions'
import {
  isBudgetOptionLabelTaken,
  isUniqueConstraintViolation,
  normalizeBudgetOptionLabel,
} from '@/lib/budget-options'
import { db } from '@/lib/db'
import {
  messageResponse,
  readJsonBody,
  RequestBodyError,
  validationErrorResponse,
} from '@/lib/http/response'
import { budgetOptionSchema } from '@/lib/validation/forms'

function revalidateBudgetPaths() {
  revalidatePath('/')
  revalidatePath('/bao-gia')
  revalidatePath('/admin/content')
  revalidatePath('/portal/admin/content')
}

class BudgetOptionLimitError extends Error {}

export async function GET() {
  const auth = await authorizeRead()
  if (auth.error) return auth.error
  if (!hasPermission(auth.user, 'admin.content.read'))
    return messageResponse('Bạn không có quyền xem cấu hình ngân sách.', 403)

  try {
    const options = await db.budgetOption.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        label: true,
        sortOrder: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return NextResponse.json({ ok: true, data: options })
  } catch (error) {
    console.error('Không thể tải cấu hình ngân sách.', error)
    return messageResponse('Không thể tải cấu hình ngân sách lúc này.', 500)
  }
}

export async function POST(request: Request) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth.error
  if (!hasPermission(auth.user, 'admin.content.write'))
    return messageResponse(
      'Bạn không có quyền cập nhật cấu hình ngân sách.',
      403,
    )

  try {
    const result = budgetOptionSchema.safeParse(await readJsonBody(request))
    if (!result.success) return validationErrorResponse(result.error)

    const label = result.data.label.trim()
    if (await isBudgetOptionLabelTaken(label)) {
      return messageResponse('Khoảng ngân sách này đã tồn tại.', 409)
    }

    const option = await db.$transaction(
      async (tx) => {
        const optionCount = await tx.budgetOption.count()
        if (optionCount >= 50) throw new BudgetOptionLimitError()

        return tx.budgetOption.create({
          data: {
            ...result.data,
            label,
            normalizedLabel: normalizeBudgetOptionLabel(label),
          },
          select: {
            id: true,
            label: true,
            sortOrder: true,
            active: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      },
      { isolationLevel: 'Serializable' },
    )

    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'CREATE_BUDGET_OPTION',
      entity: 'BudgetOption',
      entityId: option.id,
      metadata: {
        label: normalizeBudgetOptionLabel(option.label),
        sortOrder: option.sortOrder,
        active: option.active,
      },
    })
    revalidateBudgetPaths()

    return NextResponse.json(
      { ok: true, message: 'Đã thêm khoảng ngân sách.', data: option },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    if (error instanceof BudgetOptionLimitError)
      return messageResponse(
        'Đã đạt giới hạn 50 khoảng ngân sách. Hãy cập nhật mục hiện có.',
        409,
      )
    if (isUniqueConstraintViolation(error))
      return messageResponse('Khoảng ngân sách này đã tồn tại.', 409)
    console.error('Không thể tạo khoảng ngân sách.', error)
    return messageResponse('Không thể tạo khoảng ngân sách lúc này.', 500)
  }
}
