import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common')
  return { title: t('appName'), description: t('appDescription') }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // 로케일이 en일 때도 lang이 ko로 남으면 스크린리더·검색엔진이 잘못 읽는다
  const locale = await getLocale()

  return (
    <html lang={locale} className="h-full">
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
