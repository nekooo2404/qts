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
    title: 'Sản phẩm',
    links: [
      ['QTS Portal', '/san-pham/qts-portal'],
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
    title: 'Công ty & tài nguyên',
    links: [
      ['Giới thiệu', '/gioi-thieu'],
      ['Dự án', '/du-an'],
      ['Blog', '/blog'],
      ['Câu chuyện khách hàng', '/khach-hang'],
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
          <dl>
            <div>
              <dt>Địa chỉ</dt>
              <dd>[Điền địa chỉ]</dd>
            </div>
            <div>
              <dt>Điện thoại</dt>
              <dd>[Điền số điện thoại]</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>[Điền email]</dd>
            </div>
            <div>
              <dt>Mã số thuế</dt>
              <dd>[Điền mã số thuế]</dd>
            </div>
          </dl>
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
          <section>
            <h2>Hỗ trợ</h2>
            <ul>
              <li>
                <Link href="/lien-he">Liên hệ</Link>
              </li>
              <li>
                <Link href="/bao-gia">Báo giá</Link>
              </li>
              <li>
                <Link href="/portal/login">QTS Portal</Link>
              </li>
              <li>
                <span>Mạng xã hội: [Điền liên kết]</span>
              </li>
            </ul>
          </section>
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
