import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const notoSansKr = Noto_Sans_KR({ 
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: 'KQCI 카드뉴스 제작기',
  description: 'AI 기반 텍스트 구조화 & 인스타그램 카드뉴스 자동 생성',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning on <html> + <body>: Arc/Comet/Grammarly inject
    // style attrs (user-select, etc.) into the SSR HTML before hydration. React
    // 19 strict mode otherwise aborts the tree. Suppression only skips the
    // warning at this exact level — it does NOT mask issues in child trees.
    <html
      lang="ko"
      className={`${notoSansKr.variable} bg-gradient-to-br from-slate-50 to-slate-100`}
      suppressHydrationWarning
    >
      <body
        className="font-sans antialiased bg-gradient-to-br from-slate-50 to-slate-100"
        suppressHydrationWarning
      >
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
