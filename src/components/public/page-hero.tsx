import { Breadcrumbs } from '@/components/public/breadcrumbs'

type PageHeroProps = {
  eyebrow: string
  title: string
  description: string
  breadcrumbs: Array<{ label: string; href: string }>
  note?: string
}

export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  note,
}: PageHeroProps) {
  return (
    <header className="page-hero">
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <div className="page-hero__inner">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          {note && <small className="page-hero__note">{note}</small>}
        </div>
      </div>
    </header>
  )
}
