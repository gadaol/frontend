'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'
import StepIndicator from './StepIndicator'
import { createClient } from '@/lib/supabase/client'

interface Props {
  onNext: () => void
}

export default function TermsStep({ onNext }: Props) {
  const t = useTranslations('auth')
  const [termsChecked, setTermsChecked] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const [loading, setLoading] = useState(false)

  const allChecked = termsChecked && privacyChecked

  const toggleAll = () => {
    const next = !allChecked
    setTermsChecked(next)
    setPrivacyChecked(next)
  }

  const handleAgree = async () => {
    if (!allChecked) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ terms_agreed_at: new Date().toISOString() })
        .eq('id', user.id)
    }
    setLoading(false)
    onNext()
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center px-6 py-5">
        <StepIndicator current={1} total={4} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="mb-8">
          <h1 className="text-ink mb-2 text-[24px] leading-snug font-bold">{t('termsAgreeTitle')}</h1>
          <p className="text-ink3 text-[14px] leading-relaxed">{t('termsAgreeDesc')}</p>
        </div>

        {/* 전체 동의 */}
        <button
          type="button"
          onClick={toggleAll}
          className="border-border mb-4 flex w-full items-center gap-3 rounded-xl border p-4"
        >
          <CheckCircle checked={allChecked} />
          <span className="text-ink text-[15px] font-semibold">{t('agreeAll')}</span>
        </button>

        <div className="mb-8 flex flex-col gap-3 pl-1">
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

        <Button onClick={handleAgree} disabled={!allChecked || loading} fullWidth>
          {t('termsAgreeAction')}
        </Button>
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
