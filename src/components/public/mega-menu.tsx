import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import type { MenuGroup } from '@/config/marketing'

type MegaMenuProps = {
  id: string
  label: string
  href: string
  groups: MenuGroup[]
}

export function MegaMenu({ id, label, href, groups }: MegaMenuProps) {
  return (
    <div
      id={id}
      className="mega-menu"
      role="region"
      aria-label={`Menu ${label}`}
    >
      <div className="mega-menu__rail">
        <p className="mega-menu__eyebrow">Khám phá</p>
        <h2>{label}</h2>
        <p>Giải pháp được tổ chức theo nhu cầu để bạn tìm đúng điểm bắt đầu.</p>
        <Link className="inline-link" href={href} data-menu-link>
          Xem tổng quan <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <div className="mega-menu__groups">
        {groups.map((group) => (
          <section className="mega-menu__group" key={group.title}>
            <h3>{group.title}</h3>
            <ul>
              {group.links.map((link) => (
                <li key={`${group.title}-${link.label}`}>
                  <Link href={link.href} data-menu-link>
                    <span>{link.label}</span>
                    {link.description && <small>{link.description}</small>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
