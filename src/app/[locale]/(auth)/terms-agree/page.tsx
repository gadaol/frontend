'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function TermsAgreePage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()

  const [termsChecked, setTermsChecked] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const [loading, setLoading] = useState(false)

  const allChecked = termsChecked && privacyChecked

  const handleAgree = () => {
    if (!allChecked) return
    router.replace(`/${locale}/phone-verify`)
  }

  const handleCancel = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace(`/${locale}`)
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="flex h-14 flex-shrink-0 items-center border-b border-[#E8EAED] px-4">
        <span className="text-[17px] font-semibold text-[#0F1117]">{t('termsAgreeTitle')}</span>
      </div>

      <div className="flex flex-1 flex-col px-5 py-6">
        <p className="mb-8 text-[14px] leading-relaxed text-[#9099A8]">
          {t('termsAgreeDesc')}
        </p>

        <div className="flex flex-col gap-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
              className="h-5 w-5 rounded border-[#E8EAED] accent-[#1B6FF0]"
            />
            <span className="text-[15px] text-[#0F1117]">
              {t('termsAgreeTerms')}
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={privacyChecked}
              onChange={(e) => setPrivacyChecked(e.target.checked)}
              className="h-5 w-5 rounded border-[#E8EAED] accent-[#1B6FF0]"
            />
            <span className="text-[15px] text-[#0F1117]">
              {t('termsAgreePrivacy')}
            </span>
          </label>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-8">
          <button
            onClick={handleAgree}
            disabled={!allChecked}
            className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white disabled:opacity-50"
          >
            {t('termsAgreeAction')}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="h-[52px] w-full rounded-xl border border-[#E8EAED] text-[15px] font-medium text-[#9099A8]"
          >
            {t('termsAgreeCancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
