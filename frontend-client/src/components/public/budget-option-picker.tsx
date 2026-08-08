import type { UseFormRegisterReturn } from 'react-hook-form'

import {
  DEFAULT_BUDGET_OPTIONS,
  type BudgetOptionContract,
} from '@/lib/contracts/budget-options'

export type BudgetOption = BudgetOptionContract
export { DEFAULT_BUDGET_OPTIONS }

type BudgetOptionPickerProps = {
  idPrefix: string
  options?: readonly BudgetOption[]
  registration: UseFormRegisterReturn
  errorId: string
  invalid?: boolean
  compact?: boolean
}

export function BudgetOptionPicker({
  idPrefix,
  options = DEFAULT_BUDGET_OPTIONS,
  registration,
  errorId,
  invalid = false,
  compact = false,
}: BudgetOptionPickerProps) {
  const visibleOptions = options.length > 0 ? options : DEFAULT_BUDGET_OPTIONS

  return (
    <fieldset
      className={`budget-picker${compact ? ' budget-picker--compact' : ''}${invalid ? ' budget-picker--invalid' : ''}`}
      aria-invalid={invalid}
      aria-describedby={errorId}
    >
      <legend>Ngân sách dự kiến</legend>
      <p className="budget-picker__hint">
        Chọn khoảng phù hợp để QTS chuẩn bị đề xuất sát hơn.
      </p>
      <div className="budget-picker__options">
        {visibleOptions.map((option) => {
          const inputId = `${idPrefix}-budget-${option.id}`
          return (
            <label className="budget-option" htmlFor={inputId} key={option.id}>
              <input
                id={inputId}
                type="radio"
                value={option.label}
                aria-describedby={errorId}
                {...registration}
              />
              <span className="budget-option__surface">
                <span className="budget-option__indicator" aria-hidden="true" />
                <span className="budget-option__label">{option.label}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
