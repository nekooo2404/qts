type StatCounterProps = {
  target: number
  prefix: string
  suffix: string
  label: string
  note: string
}

export function StatCounter({
  target,
  prefix,
  suffix,
  label,
  note,
}: StatCounterProps) {
  return (
    <div className="stat-counter">
      <strong>
        {prefix}
        {target}
        {suffix}
      </strong>
      <span>{label}</span>
      <small>{note}</small>
    </div>
  )
}
