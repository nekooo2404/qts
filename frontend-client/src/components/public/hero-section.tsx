import Link from 'next/link'
import { ArrowDown, ArrowRight, Check } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function HeroSection() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="container home-hero__inner">
        <div className="home-hero__content">
          <h1 id="home-hero-title">
            <span className="home-hero__shine">Hệ sinh thái QTS</span>
            <span>kết nối dự án và vận hành</span>
          </h1>
          <p className="home-hero__domains">
            {['Website', 'Phần mềm', 'Dữ liệu', 'Tích hợp', 'Hạ tầng'].map(
              (domain, index) => (
                <span key={domain}>
                  {index > 0 && <i aria-hidden="true" />}
                  {domain}
                </span>
              ),
            )}
          </p>
          <p>
            QTS phân tích quy trình, thiết kế sản phẩm và xây dựng hệ thống để
            đội ngũ theo dõi công việc, dữ liệu và yêu cầu hỗ trợ trên cùng một
            luồng.
          </p>
          <ul className="home-hero__proofs">
            {[
              'Khảo sát đúng quy trình',
              'Giao diện theo vai trò',
              'Theo dõi sau bàn giao',
            ].map((item) => (
              <li key={item}>
                <Check size={17} strokeWidth={2} aria-hidden="true" /> {item}
              </li>
            ))}
          </ul>
          <div className="home-hero__actions">
            <Link
              className={cn(
                buttonVariants({ variant: 'primary' }),
                'home-hero__decision home-hero__decision--primary',
              )}
              href="/lien-he"
            >
              <span>Nhận tư vấn</span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link
              className={cn(
                buttonVariants({ variant: 'secondary' }),
                'home-hero__decision home-hero__decision--ecosystem',
              )}
              href="#he-sinh-thai-tuong-tac"
            >
              <span>Xem hệ sinh thái</span>
              <ArrowDown size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
