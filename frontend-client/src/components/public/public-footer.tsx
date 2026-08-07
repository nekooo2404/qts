import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { QtsLogo } from '@/components/shared/qts-logo'

const columns = [
  {
    title: 'Dịch vụ',
    links: [
      ['Thiết kế website', '/dich-vu/thiet-ke-website'],
      ['Phát triển phần mềm', '/dich-vu/phat-trien-phan-mem'],
      ['Tích hợp hệ thống', '/dich-vu/tich-hop-he-thong'],
      ['Bảo trì & vận hành', '/dich-vu/bao-tri-van-hanh'],
    ],
  },
  {
    title: 'Hệ sinh thái',
    links: [
      ['QTS Work (định hướng)', '/san-pham/qts-work'],
      ['QTS CRM (định hướng)', '/san-pham/qts-crm'],
    ],
  },
  {
    title: 'Giải pháp',
    links: [
      ['Doanh nghiệp', '/giai-phap/doanh-nghiep'],
      ['Giáo dục', '/giai-phap/giao-duc'],
      ['Thương mại', '/giai-phap/thuong-mai'],
      ['Cơ quan, tổ chức', '/giai-phap/co-quan-to-chuc'],
    ],
  },
  {
    title: 'Công ty & hỗ trợ',
    links: [
      ['Giới thiệu', '/gioi-thieu'],
      ['Dự án', '/du-an'],
      ['Blog', '/blog'],
      ['Tuyển dụng', '/tuyen-dung'],
      ['Liên hệ', '/lien-he'],
    ],
  },
] as const

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="container public-footer__statement">
        <p>Dự án, yêu cầu và tài liệu — cùng một luồng làm việc.</p>
        <Link href="/lien-he">
          Trao đổi với QTS <ArrowUpRight size={19} aria-hidden="true" />
        </Link>
      </div>
      <div className="container public-footer__top">
        <div className="public-footer__brand">
          <QtsLogo inverse />
          <p>Kiến tạo hệ thống số - Tăng tốc vận hành</p>
          <Link className="public-footer__brand-link" href="/lien-he">
            Gửi yêu cầu liên hệ
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="public-footer__index">
          {columns.map((column) => (
            <section key={column.title}>
              <h2>{column.title}</h2>
              <ul>
                {column.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href}>{label}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
      <div className="container public-footer__bottom">
        <p>© QTS Technology.</p>
        <div>
          <Link href="/chinh-sach-bao-mat">Chính sách bảo mật</Link>
          <Link href="/dieu-khoan-su-dung">Điều khoản sử dụng</Link>
        </div>
      </div>
    </footer>
  )
}
