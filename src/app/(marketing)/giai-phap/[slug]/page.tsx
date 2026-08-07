import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { OfferingDetail } from '@client/components/public/offering-detail'
import { solutionDetails } from '@client/config/marketing'
import { createMetadata } from '@/lib/seo'

type SolutionSlug = keyof typeof solutionDetails

function isSolutionSlug(value: string): value is SolutionSlug {
  return value in solutionDetails
}

export function generateStaticParams() {
  return Object.keys(solutionDetails).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!isSolutionSlug(slug)) return {}
  const solution = solutionDetails[slug]
  return createMetadata(
    solution.name,
    solution.description,
    `/giai-phap/${slug}`,
  )
}

export default async function SolutionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!isSolutionSlug(slug)) notFound()
  const solution = solutionDetails[slug]

  return (
    <OfferingDetail
      eyebrow="Giải pháp theo lĩnh vực"
      title={solution.name}
      description={solution.description}
      parentLabel="Giải pháp"
      parentHref="/giai-phap"
      pathname={`/giai-phap/${slug}`}
      benefits={solution.needs}
      deliverables={[
        'Khảo sát bối cảnh',
        'Thiết kế giải pháp',
        'Triển khai theo giai đoạn',
      ]}
    />
  )
}
