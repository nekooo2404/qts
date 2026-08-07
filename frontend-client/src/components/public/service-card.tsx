import Link from 'next/link'
import { ArrowUpRight, Check } from 'lucide-react'

import { MarketingIcon } from '@client/components/public/marketing-icon'

type ServiceCardProps = {
  item: {
    shortName: string
    description: string
    benefits: readonly string[]
    icon: string
  }
  href: string
}

export function ServiceCard({ item, href }: ServiceCardProps) {
  return (
    <article className="service-card">
      <span className="service-card__icon">
        <MarketingIcon name={item.icon} />
      </span>
      <h3>{item.shortName}</h3>
      <p>{item.description}</p>
      <ul>
        {item.benefits.slice(0, 3).map((benefit) => (
          <li key={benefit}>
            <Check size={15} aria-hidden="true" /> {benefit}
          </li>
        ))}
      </ul>
      <Link href={href} className="inline-link">
        Xem chi tiết <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </article>
  )
}
