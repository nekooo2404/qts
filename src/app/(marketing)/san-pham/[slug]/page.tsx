import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { OfferingDetail } from '@/components/public/offering-detail'
import { PortalPreview } from '@/components/public/portal-preview'
import { productDetails } from '@/config/marketing'
import { createMetadata } from '@/lib/seo'

type ProductSlug = keyof typeof productDetails

function isProductSlug(value: string): value is ProductSlug {
  return value in productDetails
}

export function generateStaticParams() {
  return Object.keys(productDetails).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!isProductSlug(slug)) return {}
  const product = productDetails[slug]
  return createMetadata(product.name, product.description, `/san-pham/${slug}`)
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!isProductSlug(slug)) notFound()
  const product = productDetails[slug]

  return (
    <>
      <OfferingDetail
        eyebrow={product.eyebrow}
        title={product.name}
        description={product.description}
        parentLabel="Sản phẩm"
        parentHref="/san-pham"
        pathname={`/san-pham/${slug}`}
        benefits={product.features}
        deliverables={product.features.slice(0, 3)}
        status={product.status}
      />
      {slug === 'qts-portal' && (
        <section
          className="section section--surface product-preview-band"
          aria-label="Bản xem trước QTS Portal"
        >
          <div className="container">
            <PortalPreview />
          </div>
        </section>
      )}
    </>
  )
}
