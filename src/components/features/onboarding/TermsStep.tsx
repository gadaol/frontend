'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import StepIndicator from './StepIndicator'
import { createClient } from '@/lib/supabase/client'
import ServiceTermsPage from '@/app/[locale]/terms/service/page'
import PrivacyPolicyPage from '@/app/[locale]/terms/privacy/page'
import LocationTermsPage from '@/app/[locale]/terms/location/page'

type TermsKey = 'service' | 'privacy' | 'location'

const TERMS_META: Record<TermsKey, { title: string; Component: React.ComponentType }> = {
  service: { title: '서비스 이용약관', Component: ServiceTermsPage },
  privacy: { title: '개인정보처리방침', Component: PrivacyPolicyPage },
  location: { title: '위치기반서비스 이용약관', Component: LocationTermsPage },
}

interface Props {
  onNext: () => void
}

export default function TermsStep({ onNext }: Props) {
  const t = useTranslations('auth')
  const [termsChecked, setTermsChecked] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const [locationChecked, setLocationChecked] = useState(false)
  const [marketingChecked, setMarketingChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [viewing, setViewing] = useState<TermsKey | null>(null)

  const requiredChecked = termsChecked && privacyChecked && locationChecked
  const allChecked = requiredChecked && marketingChecked

  function toggleAll() {
    const next = !allChecked
    setTermsChecked(next)
    setPrivacyChecked(next)
    setLocationChecked(next)
    setMarketingChecked(next)
  }

  async function handleAgree() {
    if (!requiredChecked) return
    setLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const now = new Date().toISOString()
      await supabase
        .from('profiles')
        .update({
          terms_agreed_at: now,
          location_agreed_at: now,
          marketing_agreed_at: marketingChecked ? now : null,
        })
        .eq('id', user.id)
    }
    setLoading(false)
    onNext()
  }

  if (viewing) {
    const { title, Component } = TERMS_META[viewing]
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-4 py-3">
          <button
            type="button"
            onClick={() => setViewing(null)}
            className="flex h-9 w-9 items-center justify-center rounded-full"
          >
            <ChevronLeft size={22} className="text-ink2" />
          </button>
          <span className="text-ink text-[15px] font-semibold">{title}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Component />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center px-6 py-5">
        <StepIndicator current={1} total={4} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="mb-8">
          <h1 className="text-ink mb-2 text-[24px] leading-snug font-bold">
            {t('termsAgreeTitle')}
          </h1>
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
          <TermsRow
            checked={termsChecked}
            onChange={setTermsChecked}
            label="(필수) 이용약관 동의"
            onView={() => setViewing('service')}
          />
          <TermsRow
            checked={privacyChecked}
            onChange={setPrivacyChecked}
            label="(필수) 개인정보 처리방침 동의"
            onView={() => setViewing('privacy')}
          />
          <TermsRow
            checked={locationChecked}
            onChange={setLocationChecked}
            label="(필수) 위치기반서비스 이용약관 동의"
            onView={() => setViewing('location')}
          />
          <TermsRow
            checked={marketingChecked}
            onChange={setMarketingChecked}
            label="(선택) 마케팅 정보 수신 동의"
          />
        </div>

        <Button onClick={handleAgree} disabled={!requiredChecked || loading} fullWidth>
          {t('termsAgreeAction')}
        </Button>
      </div>
    </div>
  )
}

function TermsRow({
  checked,
  onChange,
  label,
  onView,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  onView?: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-3">
        <CheckCircle checked={checked} size={20} />
        <span className="text-ink3 text-left text-[14px]">{label}</span>
      </button>
      {onView && (
        <button
          type="button"
          onClick={onView}
          className="text-ink3 ml-2 flex-shrink-0 text-[12px] underline underline-offset-2"
        >
          보기
        </button>
      )}
    </div>
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
