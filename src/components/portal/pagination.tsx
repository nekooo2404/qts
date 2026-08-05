import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function pageHref(
  basePath: string,
  params: Record<string, string | undefined>,
  page: number,
) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params))
    if (value) query.set(key, value)
  query.set('page', String(page))
  return `${basePath}?${query.toString()}`
}

export function Pagination({
  basePath,
  page,
  pageCount,
  params,
}: {
  basePath: string
  page: number
  pageCount: number
  params: Record<string, string | undefined>
}) {
  if (pageCount <= 1) return null
  return (
    <nav className="portal-pagination" aria-label="Phân trang">
      {page > 1 ? (
        <Link href={pageHref(basePath, params, page - 1)}>
          <ChevronLeft size={16} aria-hidden /> Trước
        </Link>
      ) : (
        <span aria-disabled="true">
          <ChevronLeft size={16} aria-hidden /> Trước
        </span>
      )}
      <strong>
        Trang {page} / {pageCount}
      </strong>
      {page < pageCount ? (
        <Link href={pageHref(basePath, params, page + 1)}>
          Sau <ChevronRight size={16} aria-hidden />
        </Link>
      ) : (
        <span aria-disabled="true">
          Sau <ChevronRight size={16} aria-hidden />
        </span>
      )}
    </nav>
  )
}
