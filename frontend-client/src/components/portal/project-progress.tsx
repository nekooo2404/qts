type ProjectProgressProps = {
  value: number
  label?: string
}

export function ProjectProgress({
  value,
  label = 'Tiến độ',
}: ProjectProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="project-progress">
      <div>
        <span>{label}</span>
        <strong>{clamped}%</strong>
      </div>
      <div
        className="project-progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
      >
        <span
          style={{ '--progress-width': `${clamped}%` } as React.CSSProperties}
        />
      </div>
    </div>
  )
}
