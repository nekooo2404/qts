import Link from 'next/link'
import {
  Blocks,
  ChartNoAxesCombined,
  LayoutTemplate,
  Waypoints,
} from 'lucide-react'

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
        Sơ đồ giới thiệu hệ thống năng lực QTS bên cạnh bốn nhóm gồm website,
        phần mềm, dữ liệu và tích hợp.
      </figcaption>
      <div className="ecosystem-visual__topology">
        <div className="ecosystem-visual__core">
          <div className="ecosystem-visual__core-label">
            <span aria-hidden="true" />
            QTS Technology · hệ thống số
          </div>
          <div className="ecosystem-visual__core-dashboard">
            <div className="ecosystem-visual__core-intro">
              <span className="ecosystem-visual__core-mark" aria-hidden="true">
                Q
              </span>
              <div>
                <strong>Thiết kế để vận hành</strong>
                <small>Quy trình · dữ liệu · con người</small>
              </div>
            </div>
            <div className="ecosystem-visual__core-grid" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="ecosystem-visual__core-note">
              <strong>Một bản đồ năng lực</strong>
              <span>Chọn đúng điểm bắt đầu cho từng bài toán.</span>
            </div>
          </div>
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
