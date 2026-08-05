import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { ProductCard } from '@/components/public/product-card'
import { platformGroups } from '@/config/marketing'

export function ProductCatalogue() {
  return (
    <div className="product-catalogue">
      {platformGroups.map((group) => (
        <section className="product-catalogue__group" key={group.id}>
          <header>
            <div>
              <h3>{group.title}</h3>
              <p>{group.description}</p>
            </div>
            <Link href={group.href} aria-label={`Xem nhóm ${group.title}`}>
              Xem nhóm <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </header>
          <div className="product-catalogue__items">
            {group.products.map((product) => (
              <ProductCard
                product={product}
                key={`${group.id}-${product.name}`}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
