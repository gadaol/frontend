'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChevronLeftIcon } from '@/components/icons'

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
      className={`bg-bg sticky top-0 z-10 flex h-14 flex-shrink-0 items-center px-4 ${
        border ? 'border-border border-b' : ''
      }`}
    >
      {onBack ? (
        <button
          onClick={handleBack}
          className="text-ink flex h-10 w-10 items-center justify-center"
          aria-label={t('back')}
        >
          <ChevronLeftIcon size={24} />
        </button>
      ) : (
        <div className="w-10" />
      )}

      {title && (
        <span className="text-ink flex-1 text-center text-[17px] font-semibold">{title}</span>
      )}

      <div className="flex min-w-10 items-center justify-end">{right}</div>
    </header>
  )
}
