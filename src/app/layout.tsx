import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro, Space_Grotesk } from 'next/font/google'
import { Toaster } from 'sonner'

import { getAppUrl } from '@/lib/seo'

import './globals.css'

const bodyFont = Be_Vietnam_Pro({
  variable: '--font-be-vietnam',
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const displayFont = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['vietnamese', 'latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: getAppUrl(),
  title: {
    default: 'QTS Technology | Kiến tạo hệ thống số',
    template: '%s | QTS Technology',
  },
  description:
    'QTS tư vấn, thiết kế và phát triển phần mềm, website và cổng thông tin doanh nghiệp theo quy trình vận hành thực tế.',
  applicationName: 'QTS Technology',
  creator: 'QTS Technology',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'QTS Technology',
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f8fb' },
    { media: '(prefers-color-scheme: dark)', color: '#071a2e' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="vi"
      className={`${bodyFont.variable} ${displayFont.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <a className="skip-link" href="#main-content">
          Chuyển đến nội dung chính
        </a>
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{ duration: 4200 }}
        />
      </body>
    </html>
  )
}
