import { MarketingIcon } from '@client/components/public/marketing-icon'
import { qtsAdvantages } from '@client/config/marketing'

export function AdvantagesGrid() {
  return (
    <div className="advantages-grid">
      {qtsAdvantages.map(([icon, title, description], index) => (
        <article key={title}>
          <span className="advantages-grid__number">0{index + 1}</span>
          <span className="advantages-grid__icon">
            <MarketingIcon name={icon} />
          </span>
          <h3>{title}</h3>
          <p>{description}</p>
        </article>
      ))}
    </div>
  )
}
