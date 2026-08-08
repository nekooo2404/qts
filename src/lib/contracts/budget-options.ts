export type BudgetOptionContract = {
  id: string
  label: string
}

export const DEFAULT_BUDGET_OPTIONS: readonly BudgetOptionContract[] = [
  { id: 'budget-under-100', label: 'Dưới 100 triệu' },
  { id: 'budget-100-200', label: '100-200 triệu' },
  { id: 'budget-200-500', label: '200-500 triệu' },
  { id: 'budget-over-500', label: 'Trên 500 triệu' },
  { id: 'budget-advice', label: 'Cần QTS tư vấn' },
]
