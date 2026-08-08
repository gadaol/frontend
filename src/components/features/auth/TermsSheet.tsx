'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'

interface Props {
  onAgree: () => void
  onCancel: () => void
}

export default function TermsSheet({ onAgree, onCancel }: Props) {
  const ta = useTranslations('auth')
  const t = useTranslations('auth')
  const [termsChecked, setTermsChecked] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)

  const allChecked = termsChecked && privacyChecked

  const toggleAll = () => {
    const next = !allChecked
    setTermsChecked(next)
    setPrivacyChecked(next)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onCancel}>
      <div
        className="w-full rounded-t-[24px] bg-white px-5 pt-6 pb-10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200" />

        <h2 className="text-ink mb-1 text-[18px] font-bold">{t('termsAgreeTitle')}</h2>
        <p className="text-ink3 mb-6 text-[13px]">{t('termsAgreeDesc')}</p>

        {/* 전체 동의 */}
        <button
          type="button"
          onClick={toggleAll}
          className="border-border mb-4 flex w-full items-center gap-3 rounded-xl border p-4"
        >
          <CheckCircle checked={allChecked} />
          <span className="text-ink text-[15px] font-semibold">{ta('agreeAll')}</span>
        </button>

        <div className="flex flex-col gap-3 pl-1">
          <CheckRow
            checked={termsChecked}
            onChange={setTermsChecked}
            label={t('termsAgreeTerms')}
          />
          <CheckRow
            checked={privacyChecked}
            onChange={setPrivacyChecked}
            label={t('termsAgreePrivacy')}
          />
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Button onClick={onAgree} disabled={!allChecked} fullWidth>
            {t('termsAgreeAction')}
          </Button>
          <button
            type="button"
            onClick={onCancel}
            className="text-ink3 py-2 text-[14px] font-medium"
          >
            {t('termsAgreeCancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-3">
      <CheckCircle checked={checked} size={20} />
      <span className="text-ink3 text-[14px]">{label}</span>
    </button>
  )
}

function CheckCircle({ checked, size = 24 }: { checked: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
      <circle
        cx="12"
        cy="12"
        r="11"
        fill={checked ? 'var(--color-primary)' : 'transparent'}
        stroke={checked ? 'var(--color-primary)' : 'var(--color-border)'}
        strokeWidth="1.5"
      />
      <path
        d="M7.5 12l3 3 6-6"
        stroke={checked ? 'white' : 'var(--color-border)'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
