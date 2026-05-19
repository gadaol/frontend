import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '가다올',
  description: '같이 가다, 함께 올게',
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
