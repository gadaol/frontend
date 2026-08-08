import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '가다로그',
  description: '나만의 여행 로그를 기록하다',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="flex min-h-full flex-col antialiased">{children}</body>
    </html>
  )
}
