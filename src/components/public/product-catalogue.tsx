import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { ProductCard } from '@/components/public/product-card'
import { platformGroups } from '@/config/marketing'

export function ProductCatalogue({
  excludePortal = false,
}: {
  excludePortal?: boolean
}) {
  const groups = excludePortal
    ? platformGroups.flatMap((group) => {
        const products = group.products.filter(
          (product) => product.href !== '/san-pham/qts-portal',
        )
        return products.length
          ? [
              {
                ...group,
                description:
                  group.id === 'work-platforms'
                    ? 'Các nền tảng làm việc được ghi rõ trạng thái và lộ trình kết nối.'
                    : group.description,
                products,
              },
            ]
          : []
      })
    : platformGroups

  return (
    <div className="product-catalogue">
      {groups.map((group) => (
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
