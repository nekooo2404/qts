import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { recordAudit } from '@/lib/audit'
import { authorizeMutation } from '@/lib/auth/api'
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
import { budgetOptionUpdateSchema } from '@/lib/validation/forms'

function revalidateBudgetPaths() {
  revalidatePath('/')
  revalidatePath('/bao-gia')
  revalidatePath('/admin/content')
  revalidatePath('/portal/admin/content')
}

async function authorizeBudgetMutation(request: Request) {
  const auth = await authorizeMutation(request)
  if (auth.error) return auth
  if (!hasPermission(auth.user, 'admin.content.write')) {
    return {
      user: null,
      error: messageResponse(
        'Bạn không có quyền cập nhật cấu hình ngân sách.',
        403,
      ),
    } as const
  }
  return auth
}

class BudgetOptionNotFoundError extends Error {}

class BudgetOptionConflictError extends Error {}

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/portal/admin/budget-options/[id]'>,
) {
  const auth = await authorizeBudgetMutation(request)
  if (auth.error) return auth.error
  const { id } = await context.params

  try {
    const result = budgetOptionUpdateSchema.safeParse(
      await readJsonBody(request),
    )
    if (!result.success) return validationErrorResponse(result.error)

    if (
      result.data.label &&
      (await isBudgetOptionLabelTaken(result.data.label, id))
    ) {
      return messageResponse('Khoảng ngân sách này đã tồn tại.', 409)
    }

    const data = {
      ...result.data,
      ...(result.data.label ? { label: result.data.label.trim() } : {}),
      ...(result.data.label
        ? { normalizedLabel: normalizeBudgetOptionLabel(result.data.label) }
        : {}),
    }
    const option = await db.$transaction(
      async (tx) => {
        const current = await tx.budgetOption.findUnique({
          where: { id },
          select: { id: true, active: true },
        })
        if (!current) throw new BudgetOptionNotFoundError()

        if (current.active && result.data.active === false) {
          const activeCount = await tx.budgetOption.count({
            where: { active: true },
          })
          if (activeCount <= 1) throw new BudgetOptionConflictError()
        }

        return tx.budgetOption.update({
          where: { id },
          data,
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
      action: 'UPDATE_BUDGET_OPTION',
      entity: 'BudgetOption',
      entityId: option.id,
      metadata: {
        label: normalizeBudgetOptionLabel(option.label),
        sortOrder: option.sortOrder,
        active: option.active,
      },
    })
    revalidateBudgetPaths()

    return NextResponse.json({
      ok: true,
      message: 'Đã cập nhật khoảng ngân sách.',
      data: option,
    })
  } catch (error) {
    if (error instanceof RequestBodyError)
      return messageResponse(error.message, 400)
    if (error instanceof BudgetOptionNotFoundError)
      return messageResponse('Không tìm thấy khoảng ngân sách.', 404)
    if (error instanceof BudgetOptionConflictError)
      return messageResponse(
        'Cần giữ lại ít nhất một khoảng ngân sách đang hiển thị.',
        409,
      )
    if (isUniqueConstraintViolation(error))
      return messageResponse('Khoảng ngân sách này đã tồn tại.', 409)
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      error.code === 'P2025'
    )
      return messageResponse('Không tìm thấy khoảng ngân sách.', 404)
    console.error('Không thể cập nhật khoảng ngân sách.', error)
    return messageResponse('Không thể cập nhật khoảng ngân sách lúc này.', 500)
  }
}

/**
 * Deactivation keeps the option label available in historical quote records
 * and lets an administrator restore it later with PATCH { active: true }.
 */
export async function DELETE(
  request: Request,
  context: RouteContext<'/api/portal/admin/budget-options/[id]'>,
) {
  const auth = await authorizeBudgetMutation(request)
  if (auth.error) return auth.error
  const { id } = await context.params

  try {
    const option = await db.$transaction(
      async (tx) => {
        const current = await tx.budgetOption.findUnique({
          where: { id },
          select: { id: true, label: true, active: true },
        })
        if (!current) throw new BudgetOptionNotFoundError()
        if (current.active) {
          const activeCount = await tx.budgetOption.count({
            where: { active: true },
          })
          if (activeCount <= 1) throw new BudgetOptionConflictError()
        }

        return tx.budgetOption.update({
          where: { id },
          data: { active: false },
          select: { id: true, label: true, sortOrder: true, active: true },
        })
      },
      { isolationLevel: 'Serializable' },
    )

    await recordAudit({
      request,
      userId: auth.user.id,
      action: 'DEACTIVATE_BUDGET_OPTION',
      entity: 'BudgetOption',
      entityId: option.id,
      metadata: { label: normalizeBudgetOptionLabel(option.label) },
    })
    revalidateBudgetPaths()

    return NextResponse.json({
      ok: true,
      message: 'Đã ẩn khoảng ngân sách khỏi biểu mẫu công khai.',
      data: option,
    })
  } catch (error) {
    if (error instanceof BudgetOptionNotFoundError)
      return messageResponse('Không tìm thấy khoảng ngân sách.', 404)
    if (error instanceof BudgetOptionConflictError)
      return messageResponse(
        'Cần giữ lại ít nhất một khoảng ngân sách đang hiển thị.',
        409,
      )
    if (isUniqueConstraintViolation(error))
      return messageResponse('Khoảng ngân sách này đã tồn tại.', 409)
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return messageResponse('Không tìm thấy khoảng ngân sách.', 404)
    }
    console.error('Không thể ẩn khoảng ngân sách.', error)
    return messageResponse('Không thể ẩn khoảng ngân sách lúc này.', 500)
  }
}
