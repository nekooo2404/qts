import Link from 'next/link'
import {
  Blocks,
  ChartNoAxesCombined,
  LayoutTemplate,
  Waypoints,
} from 'lucide-react'

import { PortalPreview } from '@/components/public/portal-preview'

const nodes = [
  {
    id: 'experience',
    title: 'Website',
    description: 'Website · UI/UX',
    href: '/dich-vu/thiet-ke-website',
    Icon: LayoutTemplate,
  },
  {
    id: 'software',
    title: 'Phần mềm',
    description: 'Quy trình · vai trò',
    href: '/dich-vu/phat-trien-phan-mem',
    Icon: Blocks,
  },
  {
    id: 'data',
    title: 'Dữ liệu',
    description: 'Dashboard · báo cáo',
    href: '/giai-phap/doanh-nghiep',
    Icon: ChartNoAxesCombined,
  },
  {
    id: 'integration',
    title: 'Tích hợp',
    description: 'API · đồng bộ',
    href: '/dich-vu/tich-hop-he-thong',
    Icon: Waypoints,
  },
] as const

export function EcosystemHeroVisual() {
  return (
    <figure
      className="ecosystem-visual"
      aria-labelledby="ecosystem-visual-caption"
    >
      <figcaption id="ecosystem-visual-caption" className="sr-only">
        Sơ đồ giới thiệu bề mặt QTS Portal bên cạnh bốn nhóm năng lực gồm
        website, phần mềm, dữ liệu và tích hợp.
      </figcaption>
      <div className="ecosystem-visual__topology">
        <div className="ecosystem-visual__core">
          <div className="ecosystem-visual__core-label">
            <span aria-hidden="true" />
            QTS Portal · bề mặt sản phẩm demo
          </div>
          <PortalPreview compact />
        </div>
        {nodes.map(({ id, title, description, href, Icon }) => (
          <Link
            className={`ecosystem-visual__node ecosystem-visual__node--${id}`}
            href={href}
            key={id}
          >
            <span className="ecosystem-visual__node-icon">
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span>
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
          </Link>
        ))}
      </div>
    </figure>
  )
}
