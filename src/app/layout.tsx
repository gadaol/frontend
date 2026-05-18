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
      <body className="flex min-h-full flex-col antialiased">{children}</body>
    </html>
  )
}
