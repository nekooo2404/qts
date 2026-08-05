import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Check } from 'lucide-react'

import { PageHero } from '@/components/public/page-hero'
import { productDetails } from '@/config/marketing'
import { createMetadata } from '@/lib/seo'

export const metadata: Metadata = createMetadata(
  'Sản phẩm QTS',
  'Khám phá QTS Portal và các định hướng sản phẩm QTS Work, QTS CRM cho vận hành doanh nghiệp.',
  '/san-pham',
)

export default function ProductsPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Sản phẩm QTS"
        title="Bề mặt làm việc được tổ chức quanh dữ liệu và vai trò"
        description="QTS Portal là bản demo hoạt động; QTS CRM và QTS Work là định hướng sản phẩm mẫu, chưa phải tuyên bố thương mại chính thức."
        breadcrumbs={[{ label: 'Sản phẩm', href: '/san-pham' }]}
      />
      <section className="section">
        <div className="container product-list">
          {Object.entries(productDetails).map(([slug, product], index) => (
            <article key={slug}>
              <div className="product-list__index">
                <span>QTS / PRODUCT</span>
                <strong>0{index + 1}</strong>
              </div>
              <div className="product-list__body">
                <span className="eyebrow">{product.eyebrow}</span>
                <h2>{product.name}</h2>
                <p>{product.description}</p>
                <ul>
                  {product.features.map((feature) => (
                    <li key={feature}>
                      <Check size={16} aria-hidden="true" /> {feature}
                    </li>
                  ))}
                </ul>
                <Link className="inline-link" href={`/san-pham/${slug}`}>
                  Xem sản phẩm <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
              <div className="product-list__status">
                <span>{product.status}</span>
                <div>
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
