import { PublicFooter } from '@/components/public/public-footer'
import { PublicHeader } from '@/components/public/public-header'
import { StructuredData } from '@/components/shared/structured-data'
import { organizationJsonLd } from '@/lib/seo'

export default function MarketingLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <StructuredData data={organizationJsonLd()} />
      <PublicHeader />
      {children}
      <PublicFooter />
    </>
  )
}
