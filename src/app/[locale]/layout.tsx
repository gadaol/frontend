import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import { GoogleMapsPatch } from '@/components/common/GoogleMapsPatch'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'ko' | 'en')) {
    notFound()
  }

  /**
   * i18n/request.ts가 이미 모든 네임스페이스를 읽어둔다. 여기서 목록을 또
   * 만들면 두 곳이 어긋나 클라이언트 컴포넌트만 번역이 비는 사고가 난다.
   * (실제로 backlog·ai가 이 목록에서 빠져 있었다)
   */
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <GoogleMapsPatch />
      {children}
    </NextIntlClientProvider>
  )
}
