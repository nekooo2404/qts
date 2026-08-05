import Link from 'next/link'
import { ArrowLeft, Home, RotateCcw, ShieldAlert } from 'lucide-react'

import { QtsLogo } from '@/components/shared/qts-logo'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ErrorStateProps = {
  code: string
  title: string
  description: string
  reset?: () => void
}

export function ErrorState({
  code,
  title,
  description,
  reset,
}: ErrorStateProps) {
  return (
    <main id="main-content" className="error-state">
      <div className="error-state__inner">
        <QtsLogo />
        <span className="error-state__code">{code}</span>
        <ShieldAlert size={34} aria-hidden="true" />
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="error-state__actions">
          {reset && (
            <Button onClick={reset}>
              <RotateCcw size={17} aria-hidden="true" /> Thử lại
            </Button>
          )}
          <Link
            className={cn(
              buttonVariants({ variant: reset ? 'secondary' : 'primary' }),
            )}
            href="/"
          >
            <Home size={17} aria-hidden="true" /> Về trang chủ
          </Link>
          <Link
            className={cn(buttonVariants({ variant: 'ghost' }))}
            href="/lien-he"
          >
            <ArrowLeft size={17} aria-hidden="true" /> Liên hệ hỗ trợ
          </Link>
        </div>
      </div>
    </main>
  )
}
