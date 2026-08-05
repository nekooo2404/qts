import { CircleAlert, CircleCheck } from 'lucide-react'

export type FormFeedbackValue = {
  type: 'success' | 'error'
  message: string
} | null

export function FormFeedback({
  value,
  className,
}: {
  value: FormFeedbackValue
  className?: string
}) {
  if (!value) return null
  return (
    <p
      className={`form-message form-message--${value.type}${className ? ` ${className}` : ''}`}
      role={value.type === 'error' ? 'alert' : 'status'}
    >
      {value.type === 'success' ? (
        <CircleCheck size={18} aria-hidden />
      ) : (
        <CircleAlert size={18} aria-hidden />
      )}
      {value.message}
    </p>
  )
}
