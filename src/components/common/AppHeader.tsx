'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface Props {
  title?: string
  onBack?: (() => void) | 'router'
  right?: React.ReactNode
  border?: boolean
}

export default function AppHeader({ title, onBack, right, border = true }: Props) {
  const t = useTranslations('common')
  const router = useRouter()

  const handleBack = () => {
    if (!onBack) return
    if (onBack === 'router') router.back()
    else onBack()
  }

  return (
    <header
      className={`sticky top-0 z-10 flex h-14 flex-shrink-0 items-center bg-white px-4 ${
        border ? 'border-b border-[#E8EAED]' : ''
      }`}
    >
      {onBack ? (
        <button
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center"
          aria-label={t('back')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="#0F1117"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : (
        <div className="w-10" />
      )}

      {title && (
        <span className="flex-1 text-center text-[17px] font-semibold text-[#0F1117]">{title}</span>
      )}

      <div className="flex w-10 items-center justify-end">{right}</div>
    </header>
  )
}
