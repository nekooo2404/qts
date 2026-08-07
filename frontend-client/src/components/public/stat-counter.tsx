type StatCounterProps = {
  value: string
  label: string
  note: string
}

export function StatCounter({ value, label, note }: StatCounterProps) {
  return (
    <div className="stat-counter">
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{note}</small>
    </div>
  )
}
