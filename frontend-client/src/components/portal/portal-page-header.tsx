import type { ReactNode } from 'react'

type PortalPageHeaderProps = {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}

export function PortalPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PortalPageHeaderProps) {
  return (
    <header className="portal-page-header">
      <div>
        {eyebrow && <span>{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="portal-page-header__actions">{actions}</div>}
    </header>
  )
}
