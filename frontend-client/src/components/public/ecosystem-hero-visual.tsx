import Link from 'next/link'
import Image from 'next/image'
import {
  Blocks,
  ChartNoAxesCombined,
  GitPullRequestArrow,
  LayoutTemplate,
  LifeBuoy,
  Network,
  PanelsTopLeft,
  ShieldCheck,
  Waypoints,
} from 'lucide-react'

const nodes = [
  {
    id: 'portal',
    label: 'QTS Portal',
    description: 'Dự án · ticket',
    href: '/san-pham/qts-portal',
    tone: 'primary',
    Icon: PanelsTopLeft,
  },
  {
    id: 'work',
    label: 'QTS Work',
    description: 'Công việc · deadline',
    href: '/san-pham/qts-work',
    tone: 'primary',
    Icon: GitPullRequestArrow,
  },
  {
    id: 'crm',
    label: 'QTS CRM',
    description: 'Khách hàng · tương tác',
    href: '/san-pham/qts-crm',
    tone: 'primary',
    Icon: Network,
  },
  {
    id: 'data',
    label: 'Dữ liệu',
    description: 'Dashboard · báo cáo',
    href: '/giai-phap/doanh-nghiep',
    tone: 'data',
    Icon: ChartNoAxesCombined,
  },
  {
    id: 'integration',
    label: 'Tích hợp',
    description: 'API · đồng bộ',
    href: '/dich-vu/tich-hop-he-thong',
    tone: 'data',
    Icon: Waypoints,
  },
  {
    id: 'website',
    label: 'Website',
    description: 'Nội dung · UI/UX',
    href: '/dich-vu/thiet-ke-website',
    tone: 'neutral',
    Icon: LayoutTemplate,
  },
  {
    id: 'software',
    label: 'Phần mềm',
    description: 'Quy trình · vai trò',
    href: '/dich-vu/phat-trien-phan-mem',
    tone: 'neutral',
    Icon: Blocks,
  },
  {
    id: 'operations',
    label: 'Vận hành',
    description: 'Hỗ trợ · cải tiến',
    href: '/dich-vu/bao-tri-van-hanh',
    tone: 'neutral',
    Icon: LifeBuoy,
  },
  {
    id: 'security',
    label: 'Phân quyền',
    description: 'Vai trò · truy cập',
    href: '/giai-phap/doanh-nghiep',
    tone: 'accent',
    Icon: ShieldCheck,
  },
] as const

export function EcosystemHeroVisual() {
  return (
    <figure
      className="ecosystem-orbit ecosystem-visual"
      aria-labelledby="ecosystem-orbit-caption"
    >
      <figcaption id="ecosystem-orbit-caption" className="sr-only">
        Bản đồ tương tác của QTS với chín nhóm năng lực gồm Portal, Work, CRM,
        website, phần mềm, dữ liệu, tích hợp, vận hành và phân quyền.
      </figcaption>
      <div className="ecosystem-orbit__field ecosystem-visual__topology">
        <svg
          className="ecosystem-orbit__routes"
          viewBox="0 0 100 70"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M4 18C23 11 31 13 45 28s27 16 51 6" />
          <path d="M-2 52c18-5 28-1 39 7 12 9 27 8 41-2 10-7 16-15 24-29" />
          <path d="M15 70c8-18 24-26 37-26 17 0 24 9 39 24" />
          <path d="M28-4c4 13 14 20 27 24 17 5 29 0 45-12" />
        </svg>

        <div
          className="ecosystem-orbit__core ecosystem-visual__core"
          aria-hidden="true"
        >
          <div className="ecosystem-orbit__core-halo" />
          <div className="ecosystem-orbit__core-tile">
            <div className="ecosystem-orbit__core-ring">
              <span className="ecosystem-orbit__core-ring-hole" />
            </div>
            <span className="ecosystem-orbit__core-mark">
              <Image
                src="/brand/qts-shield.png"
                alt=""
                width={42}
                height={51}
              />
            </span>
          </div>
          <div className="ecosystem-orbit__core-label ecosystem-visual__core-label ecosystem-visual__core-intro">
            <strong>QTS</strong>
            <span>hệ thống số</span>
          </div>
          <div className="ecosystem-visual__core-note">
            <strong>Một bản đồ năng lực</strong>
            <span>Chọn đúng điểm bắt đầu cho từng bài toán.</span>
          </div>
        </div>

        {nodes.map(({ id, label, description, href, tone, Icon }, index) => (
          <Link
            className={`ecosystem-orbit__node ${index < 4 ? 'ecosystem-visual__node' : ''} ecosystem-orbit__node--${id} ecosystem-orbit__node--tone-${tone}`}
            href={href}
            key={id}
            aria-label={`${label}: ${description}`}
          >
            <span className="ecosystem-orbit__node-icon">
              <Icon size={15} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <span className="ecosystem-orbit__node-label">{label}</span>
          </Link>
        ))}
      </div>
    </figure>
  )
}
