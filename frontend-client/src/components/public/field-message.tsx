type FieldMessageProps = {
  id: string
  message?: string
}

export function FieldMessage({ id, message }: FieldMessageProps) {
  return (
    <p id={id} className="field__error field__message-slot" aria-live="polite">
      {message ?? '\u00a0'}
    </p>
  )
}
