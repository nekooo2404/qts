import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { MarketingIcon } from '@client/components/public/marketing-icon'

type ProductCardProps = {
  product: {
    name: string
    description: string
    href: string
    icon: string
    status?: string
  }
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link className="product-card" href={product.href}>
      <span className="product-card__icon">
        <MarketingIcon name={product.icon} size={20} />
      </span>
      <span className="product-card__copy">
        <strong>{product.name}</strong>
        {product.status && (
          <span className="product-card__status">{product.status}</span>
        )}
        <small>{product.description}</small>
      </span>
      <ArrowUpRight
        className="product-card__arrow"
        size={17}
        aria-hidden="true"
      />
    </Link>
  )
}
