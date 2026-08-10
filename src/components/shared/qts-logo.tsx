import Link from 'next/link'
import Image from 'next/image'

import { cn } from '@/lib/utils'

type QtsLogoProps = {
  inverse?: boolean
  href?: string
  compact?: boolean
  className?: string
}

export function QtsLogo({
  inverse = false,
  href = '/',
  compact = false,
  className,
}: QtsLogoProps) {
  return (
    <Link
      href={href}
      className={cn('qts-logo', inverse && 'qts-logo--inverse', className)}
      aria-label="QTS Technology - Trang chủ"
    >
      <span className="qts-logo__mark" aria-hidden="true">
        <Image
          className="qts-logo__mark-image"
          src="/brand/qts-shield.png"
          alt=""
          width={40}
          height={49}
        />
      </span>
      <span className="qts-logo__word">
        QTS
        {!compact && <small>Technology</small>}
      </span>
    </Link>
  )
}
