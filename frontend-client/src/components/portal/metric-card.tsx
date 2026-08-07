import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

type MetricCardProps = {
  label: string
  value: number | string
  detail: string
  href: string
  icon: LucideIcon
}

export function MetricCard({
  label,
  value,
  detail,
  href,
  icon: Icon,
}: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-card__top">
        <span>{label}</span>
        <Icon size={19} aria-hidden="true" />
      </div>
      <strong>{value}</strong>
      <div className="metric-card__bottom">
        <small>{detail}</small>
        <Link href={href} aria-label={`Mở ${label}`}>
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
