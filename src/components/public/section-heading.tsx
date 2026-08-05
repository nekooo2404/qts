import { cn } from '@/lib/utils'

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  description?: string
  centered?: boolean
  id?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
  id,
}: SectionHeadingProps) {
  return (
    <div
      className={cn('section-heading', centered && 'section-heading--center')}
    >
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 id={id}>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  )
}
