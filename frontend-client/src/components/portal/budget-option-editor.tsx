'use client'

import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, LoaderCircle, Plus, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { apiMutation, type ApiResult } from '@/lib/client/api'
import {
  budgetOptionSchema,
  budgetOptionUpdateSchema,
} from '@/lib/validation/forms'
import {
  FormFeedback,
  type FormFeedbackValue,
} from '@/components/shared/form-feedback'

export type AdminBudgetOption = {
  id: string
  label: string
  sortOrder: number
  active: boolean
}

type BudgetOptionEditorProps = {
  options: readonly AdminBudgetOption[]
  readOnly?: boolean
}

type BudgetOptionResponse = ApiResult<AdminBudgetOption> & {
  data?: AdminBudgetOption
}

function sortOptions(options: readonly AdminBudgetOption[]) {
  return [...options].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder || left.label.localeCompare(right.label),
  )
}

function nextSortOrder(options: readonly AdminBudgetOption[]) {
  return Math.max(0, ...options.map((item) => item.sortOrder)) + 10
}

export function BudgetOptionEditor({
  options,
  readOnly = false,
}: BudgetOptionEditorProps) {
  const router = useRouter()
  const [items, setItems] = useState(() => sortOptions(options))
  const [newLabel, setNewLabel] = useState('')
  const [newSortOrder, setNewSortOrder] = useState(() =>
    String(nextSortOrder(options)),
  )
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)

  async function createOption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = budgetOptionSchema.safeParse({
      label: newLabel,
      sortOrder: newSortOrder,
      active: true,
    })
    if (!parsed.success) {
      setFeedback({
        type: 'error',
        message:
          parsed.error.issues[0]?.message ?? 'Khoảng ngân sách chưa hợp lệ.',
      })
      return
    }

    setPendingId('create')
    setFeedback(null)
    try {
      const result = await apiMutation<AdminBudgetOption>(
        '/api/portal/admin/budget-options',
        'POST',
        parsed.data,
      )
      if (result.ok && result.data) {
        const nextItems = sortOptions([...items, result.data])
        setItems(nextItems)
        setNewLabel('')
        setNewSortOrder(String(nextSortOrder(nextItems)))
        setFeedback({ type: 'success', message: result.message })
        router.refresh()
      } else {
        setFeedback({ type: 'error', message: result.message })
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Không thể thêm khoảng ngân sách. Vui lòng thử lại.',
      })
    } finally {
      setPendingId(null)
    }
  }

  async function updateOption(
    event: FormEvent<HTMLFormElement>,
    option: AdminBudgetOption,
  ) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const parsed = budgetOptionUpdateSchema.safeParse({
      label: formData.get('label'),
      sortOrder: formData.get('sortOrder'),
      active: formData.has('active'),
    })
    if (!parsed.success) {
      form.reset()
      setFeedback({
        type: 'error',
        message:
          parsed.error.issues[0]?.message ?? 'Khoảng ngân sách chưa hợp lệ.',
      })
      return
    }

    setPendingId(option.id)
    setFeedback(null)
    try {
      const result = await apiMutation<AdminBudgetOption>(
        `/api/portal/admin/budget-options/${option.id}`,
        'PATCH',
        parsed.data,
      )
      if (result.ok && result.data) {
        setItems((current) =>
          sortOptions(
            current.map((item) =>
              item.id === option.id ? result.data! : item,
            ),
          ),
        )
        setFeedback({ type: 'success', message: result.message })
        router.refresh()
      } else {
        form.reset()
        setFeedback({ type: 'error', message: result.message })
      }
    } catch {
      form.reset()
      setFeedback({
        type: 'error',
        message: 'Không thể lưu khoảng ngân sách. Vui lòng thử lại.',
      })
    } finally {
      setPendingId(null)
    }
  }

  async function toggleOption(option: AdminBudgetOption) {
    setPendingId(option.id)
    setFeedback(null)
    try {
      const result: BudgetOptionResponse = await apiMutation<AdminBudgetOption>(
        `/api/portal/admin/budget-options/${option.id}`,
        option.active ? 'DELETE' : 'PATCH',
        option.active ? undefined : { active: true },
      )
      if (result.ok && result.data) {
        setItems((current) =>
          current.map((item) => (item.id === option.id ? result.data! : item)),
        )
        setFeedback({ type: 'success', message: result.message })
        router.refresh()
      } else {
        setFeedback({ type: 'error', message: result.message })
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Không thể thay đổi trạng thái. Vui lòng thử lại.',
      })
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="budget-option-editor">
      <div className="budget-option-editor__intro">
        <div>
          <strong>
            {items.filter((item) => item.active).length} mục đang hiển thị
          </strong>
          <p>
            Thứ tự và trạng thái được dùng ngay trên biểu mẫu báo giá công khai.
          </p>
        </div>
        <span className="budget-option-editor__badge">CMS</span>
      </div>

      {!readOnly && (
        <form className="budget-option-create" onSubmit={createOption}>
          <div className="field">
            <label htmlFor="new-budget-option-label">
              Tên khoảng ngân sách
            </label>
            <input
              id="new-budget-option-label"
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              placeholder="Ví dụ: 800 triệu - 1 tỷ"
              maxLength={120}
              disabled={pendingId !== null}
            />
          </div>
          <div className="field budget-option-create__order">
            <label htmlFor="new-budget-option-order">Thứ tự</label>
            <input
              id="new-budget-option-order"
              type="number"
              min={0}
              max={9999}
              value={newSortOrder}
              onChange={(event) => setNewSortOrder(event.target.value)}
              disabled={pendingId !== null}
            />
          </div>
          <Button type="submit" disabled={pendingId !== null}>
            {pendingId === 'create' ? (
              <LoaderCircle className="is-spinning" size={16} />
            ) : (
              <Plus size={16} />
            )}
            Thêm mục
          </Button>
        </form>
      )}

      <FormFeedback value={feedback} />

      <div className="budget-option-list" aria-live="polite">
        {items.length === 0 ? (
          <p className="budget-option-list__empty">
            Chưa có khoảng ngân sách nào.
          </p>
        ) : (
          items.map((option, index) => (
            <form
              className={`budget-option-row${option.active ? '' : ' is-inactive'}`}
              key={`${option.id}-${option.active}-${option.sortOrder}-${option.label}`}
              onSubmit={(event) => updateOption(event, option)}
            >
              <div
                className="budget-option-row__position"
                aria-label={`Vị trí ${index + 1}`}
              >
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="field budget-option-row__label">
                <label htmlFor={`budget-option-label-${option.id}`}>
                  Nhãn hiển thị
                </label>
                <input
                  id={`budget-option-label-${option.id}`}
                  name="label"
                  defaultValue={option.label}
                  disabled={readOnly || pendingId !== null}
                  maxLength={120}
                />
              </div>
              <div className="field budget-option-row__order">
                <label htmlFor={`budget-option-order-${option.id}`}>
                  Thứ tự
                </label>
                <input
                  id={`budget-option-order-${option.id}`}
                  name="sortOrder"
                  type="number"
                  min={0}
                  max={9999}
                  defaultValue={option.sortOrder}
                  disabled={readOnly || pendingId !== null}
                />
              </div>
              <label
                className={`checkbox-field checkbox-field--custom budget-option-row__active${
                  readOnly || pendingId !== null ? ' is-disabled' : ''
                }`}
              >
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={option.active}
                  disabled={readOnly || pendingId !== null}
                />
                <span className="checkbox-field__box" aria-hidden="true">
                  <Eye size={14} strokeWidth={2.5} />
                </span>
                <span className="checkbox-field__copy">Hiển thị</span>
              </label>
              <div className="budget-option-row__actions">
                <Button
                  type="submit"
                  size="small"
                  disabled={readOnly || pendingId !== null}
                  title="Lưu mục ngân sách"
                >
                  {pendingId === option.id ? (
                    <LoaderCircle className="is-spinning" size={15} />
                  ) : (
                    <Save size={15} />
                  )}
                  <span className="sr-only">Lưu</span>
                </Button>
                {!readOnly && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="small"
                      title={
                        option.active
                          ? 'Ẩn khỏi biểu mẫu'
                          : 'Hiện trên biểu mẫu'
                      }
                      aria-label={
                        option.active
                          ? 'Ẩn khỏi biểu mẫu'
                          : 'Hiện trên biểu mẫu'
                      }
                      disabled={pendingId !== null}
                      onClick={() => toggleOption(option)}
                    >
                      {option.active ? <EyeOff size={15} /> : <Eye size={15} />}
                    </Button>
                  </>
                )}
              </div>
            </form>
          ))
        )}
      </div>
    </div>
  )
}
