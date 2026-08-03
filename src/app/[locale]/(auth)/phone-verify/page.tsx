'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import axios from 'axios'

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

type Step = 'phone' | 'otp'

export default function PhoneVerifyPage() {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendOtp = async () => {
    if (!phone.trim()) return
    setSending(true)
    setError(null)
    try {
      await axios.post('/api/find-account/send', { phone })
      setStep('otp')
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.error ?? tc('error'))
      else setError(tc('error'))
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async () => {
    if (otp.length < 6) return
    setVerifying(true)
    setError(null)
    try {
      await axios.post('/api/social-phone-verify', { phone, code: otp })
      router.replace(`/${locale}/onboarding`)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        const message = err.response?.data?.error ?? tc('error')
        if (status === 409) {
          const existingProvider: string = err.response?.data?.existingProvider ?? ''
          router.replace(`/${locale}?error=duplicate_account&provider=${existingProvider}`)
          return
        }
        setError(message)
      } else {
        setError(tc('error'))
      }
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="flex h-14 flex-shrink-0 items-center border-b border-[#E8EAED] px-4">
        <span className="text-[17px] font-semibold text-[#0F1117]">{t('phoneVerifyTitle')}</span>
      </div>

      <div className="flex flex-1 flex-col px-5 py-6">
        {step === 'phone' && (
          <>
            <p className="mb-6 text-[14px] leading-relaxed text-[#9099A8]">
              {t('phoneVerifyDesc')}
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#0F1117]">{t('phoneLabel')}</label>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder={t('phonePlaceholder')}
                className="h-12 rounded-xl border border-[#E8EAED] px-3.5 text-[15px] text-[#0F1117] outline-none focus:border-[#1B6FF0] focus:ring-2 focus:ring-[#1B6FF0]/10"
              />
            </div>
            {error && <span className="mt-2 text-[13px] text-[#F04438]">{error}</span>}
            <div className="mt-auto pt-8">
              <button
                onClick={handleSendOtp}
                disabled={sending || phone.length < 13}
                className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white disabled:opacity-50"
              >
                {sending ? t('otpSending') : t('sendOtp')}
              </button>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="mb-6 text-[14px] leading-relaxed text-[#9099A8]">
              <span className="font-medium text-[#0F1117]">{phone}</span>
              {t('otpSentDesc')}
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#0F1117]">{t('otpLabel')}</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder={t('otpPlaceholder')}
                className="h-12 rounded-xl border border-[#E8EAED] px-3.5 text-[15px] tracking-widest text-[#0F1117] outline-none focus:border-[#1B6FF0] focus:ring-2 focus:ring-[#1B6FF0]/10"
              />
            </div>
            {error && <span className="mt-2 text-[13px] text-[#F04438]">{error}</span>}
            <button
              onClick={async () => {
                setOtp('')
                setError(null)
                await handleSendOtp()
              }}
              disabled={sending}
              className="mt-3 self-start text-[13px] font-medium text-[#1B6FF0] disabled:opacity-50"
            >
              {sending ? t('otpSending') : t('resendOtp')}
            </button>
            <div className="mt-auto pt-8">
              <button
                onClick={handleVerify}
                disabled={verifying || otp.length < 6}
                className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white disabled:opacity-50"
              >
                {verifying ? t('processing') : t('verifyOtp')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
