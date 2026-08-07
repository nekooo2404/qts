import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { StructuredData } from '@/components/shared/structured-data'
import { breadcrumbJsonLd } from '@/lib/seo'

type BreadcrumbItem = { label: string; href: string }

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const schemaItems = [
    { name: 'Trang chủ', path: '/' },
    ...items.map((item) => ({ name: item.label, path: item.href })),
  ]

  return (
    <>
      <StructuredData data={breadcrumbJsonLd(schemaItems)} />
      <nav aria-label="Breadcrumb">
        <ol className="breadcrumb">
          <li>
            <Link href="/">Trang chủ</Link>
          </li>
          {items.map((item, index) => {
            const current = index === items.length - 1
            return (
              <li key={item.href} className="breadcrumb__item">
                <ChevronRight
                  className="breadcrumb__separator"
                  size={14}
                  aria-hidden="true"
                />
                {current ? (
                  <span aria-current="page">{item.label}</span>
                ) : (
                  <Link href={item.href}>{item.label}</Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
