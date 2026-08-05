import Link from 'next/link'

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
        Q
      </span>
      <span className="qts-logo__word">
        QTS
        {!compact && <small>Technology</small>}
      </span>
    </Link>
  )
}
