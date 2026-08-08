import 'server-only'

import { db } from '@/lib/db'
import { DEFAULT_BUDGET_OPTIONS } from '@/lib/contracts/budget-options'

export type BudgetOptionView = {
  id: string
  label: string
  sortOrder: number
  active: boolean
}

const fallbackBudgetOptions: BudgetOptionView[] = DEFAULT_BUDGET_OPTIONS.map(
  (option, index) => ({
    id: `default-budget-option-${index + 1}`,
    label: option.label,
    sortOrder: (index + 1) * 10,
    active: true,
  }),
)

/**
 * Returns the configured public options. A completely empty table uses the
 * built-in defaults so a migration can roll out without blanking the quote
 * form. Once an administrator has configured rows, inactive rows stay hidden.
 * A defensive fallback keeps the form usable if every row is disabled in an
 * older deployment.
 */
export async function getActiveBudgetOptions(): Promise<BudgetOptionView[]> {
  try {
    const options = await db.budgetOption.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        label: true,
        sortOrder: true,
        active: true,
      },
    })

    if (!options.length) return fallbackBudgetOptions
    const activeOptions = options.filter((option) => option.active)
    return activeOptions.length ? activeOptions : fallbackBudgetOptions
  } catch (error) {
    console.error('Không thể tải các khoảng ngân sách công khai.', error)
    return fallbackBudgetOptions
  }
}

export async function getActiveBudgetOptionLabels() {
  const options = await getActiveBudgetOptions()
  return options.map((option) => option.label)
}

export function normalizeBudgetOptionLabel(label: string) {
  return label.trim().normalize('NFKC').toLocaleLowerCase('vi-VN')
}

export async function isBudgetOptionLabelTaken(
  label: string,
  excludeId?: string,
) {
  const normalized = normalizeBudgetOptionLabel(label)
  const where = excludeId ? { NOT: { id: excludeId } } : undefined
  const indexedMatch = await db.budgetOption.findFirst({
    where: { ...where, normalizedLabel: normalized },
    select: { id: true },
  })
  if (indexedMatch) return true

  // Rows created before the canonical key migration are checked once so they
  // cannot bypass duplicate protection while they are being edited.
  const legacyOptions = await db.budgetOption.findMany({
    where: { ...where, normalizedLabel: null },
    select: { label: true },
  })
  return legacyOptions.some(
    (option) => normalizeBudgetOptionLabel(option.label) === normalized,
  )
}

export function isUniqueConstraintViolation(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  )
}
