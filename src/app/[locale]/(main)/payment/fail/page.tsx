import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import AppHeader from '@/components/common/AppHeader'

interface Props {
  searchParams: Promise<{ message?: string }>
}

export default async function PaymentFailPage({ searchParams }: Props) {
  const { message } = await searchParams
  const locale = await getLocale()
  const t = await getTranslations('mypage')

  return (
    <div className="bg-bg2 flex min-h-dvh flex-col">
      <AppHeader title={t('payFailTitle')} onBack="router" />
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="bg-error-light mb-5 flex h-20 w-20 items-center justify-center rounded-full">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path
              d="M18 10v10M18 24v2"
              stroke="var(--color-error)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="18" cy="18" r="15" stroke="var(--color-error)" strokeWidth="2" />
          </svg>
        </div>
        <h1 className="text-ink mb-2 text-[20px] font-bold">{t('payFailHeadline')}</h1>
        <p className="text-ink3 mb-8 text-[14px] leading-relaxed">
          {message ?? t('payFailDefault')}
        </p>
        <Link
          href={`/${locale}/mypage`}
          className="bg-primary flex h-[50px] w-full max-w-xs items-center justify-center rounded-2xl text-[15px] font-bold text-white"
        >
          {t('backToMypage')}
        </Link>
      </div>
    </div>
  )
}
