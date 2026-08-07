import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { OfferingDetail } from '@client/components/public/offering-detail'
import { StructuredData } from '@/components/shared/structured-data'
import { serviceDetails } from '@client/config/marketing'
import { createMetadata, getAppUrl } from '@/lib/seo'

type ServiceSlug = keyof typeof serviceDetails

function isServiceSlug(value: string): value is ServiceSlug {
  return value in serviceDetails
}

export function generateStaticParams() {
  return Object.keys(serviceDetails).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!isServiceSlug(slug)) return {}
  const service = serviceDetails[slug]
  return createMetadata(service.name, service.description, `/dich-vu/${slug}`)
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!isServiceSlug(slug)) notFound()
  const service = serviceDetails[slug]
  const pathname = `/dich-vu/${slug}`

  return (
    <>
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: service.name,
          description: service.description,
          url: new URL(pathname, getAppUrl()).toString(),
          provider: {
            '@type': 'Organization',
            name: 'Công ty Cổ phần Công nghệ QTS',
          },
        }}
      />
      <OfferingDetail
        eyebrow="Dịch vụ QTS"
        title={service.name}
        description={service.description}
        parentLabel="Dịch vụ"
        parentHref="/dich-vu"
        pathname={pathname}
        benefits={service.benefits}
        deliverables={service.deliverables}
      />
    </>
  )
}
