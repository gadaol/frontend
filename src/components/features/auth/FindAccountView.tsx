'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import api, { isApiError } from '@/lib/axios/client'
import Button from '@/components/ui/Button'

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

type Step = 'input' | 'otp' | 'result'

interface AccountResult {
  found: boolean
  maskedEmail?: string
  providers?: string[]
}

interface Props {
  onBack: () => void
  onGoToLogin: () => void
}

export default function FindAccountView({ onBack, onGoToLogin }: Props) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const [step, setStep] = useState<Step>('input')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AccountResult | null>(null)

  const handleSendOtp = async () => {
    if (!phone.trim()) return
    setSending(true)
    setError(null)
    try {
      await api.post('/api/find-account/send', { phone })
      setStep('otp')
    } catch (err) {
      setError(isApiError(err) ? t(err.code as never) : tc('error'))
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async () => {
    if (!otp.trim()) return
    setVerifying(true)
    setError(null)
    try {
      const { data } = await api.post('/api/find-account/verify', { phone, code: otp })
      setResult(data)
      setStep('result')
    } catch (err) {
      setError(isApiError(err) ? t(err.code as never) : tc('error'))
    } finally {
      setVerifying(false)
    }
  }

  const backAction = () => {
    if (step === 'otp') return setStep('input')
    if (step === 'result') return setStep('input')
    onBack()
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="border-border flex h-14 flex-shrink-0 items-center gap-1 border-b px-4">
        <button
          onClick={backAction}
          className="flex h-10 w-10 items-center justify-center"
          aria-label={tc('back')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="var(--color-ink)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="text-ink text-[17px] font-semibold">{t('findAccountTitle')}</span>
      </div>

      <div className="flex flex-1 flex-col px-5 py-6">
        {step === 'input' && (
          <>
            <p className="text-ink3 mb-6 text-[14px] leading-relaxed">{t('findAccountDesc')}</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-ink text-[13px] font-medium">{t('phoneLabel')}</label>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder={t('phonePlaceholder')}
                className="border-border text-ink focus:border-primary focus:ring-primary/10 h-12 rounded-xl border px-3.5 text-[15px] outline-none focus:ring-2"
              />
            </div>
            {error && <span className="text-error mt-2 text-[13px]">{error}</span>}
            <div className="mt-auto pt-8">
              <Button onClick={handleSendOtp} disabled={sending || !phone.trim()} fullWidth>
                {sending ? t('otpSending') : t('sendOtp')}
              </Button>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="text-ink3 mb-6 text-[14px] leading-relaxed">
              <span className="text-ink font-medium">{phone}</span>
              {t('otpSentDesc')}
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-ink text-[13px] font-medium">{t('otpLabel')}</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder={t('otpPlaceholder')}
                className="border-border text-ink focus:border-primary focus:ring-primary/10 h-12 rounded-xl border px-3.5 text-[15px] tracking-widest outline-none focus:ring-2"
              />
            </div>
            {error && <span className="text-error mt-2 text-[13px]">{error}</span>}
            <button
              onClick={async () => {
                setOtp('')
                setError(null)
                await handleSendOtp()
              }}
              disabled={sending}
              className="text-primary mt-3 self-start text-[13px] font-medium disabled:opacity-50"
            >
              {sending ? t('otpSending') : t('resendOtp')}
            </button>
            <div className="mt-auto pt-8">
              <Button onClick={handleVerify} disabled={verifying || otp.length < 6} fullWidth>
                {verifying ? t('processing') : t('verifyOtp')}
              </Button>
            </div>
          </>
        )}

        {step === 'result' && result && (
          <div className="flex flex-1 flex-col">
            {result.found ? (
              <>
                <h2 className="text-ink mb-6 text-[18px] font-bold">
                  {t('findAccountResultTitle')}
                </h2>
                <div className="border-border rounded-2xl border p-5">
                  <ResultRow label={t('maskedEmailLabel')} value={result.maskedEmail ?? '-'} />
                  <ResultRow
                    label={t('loginMethodLabel')}
                    value={
                      result.providers
                        ?.map((p) => {
                          if (p === 'google') return t('methodGoogle')
                          if (p === 'kakao') return t('methodKakao')
                          return t('methodEmail')
                        })
                        .join(', ') ?? '-'
                    }
                    last
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <p className="text-ink3 text-[14px]">{t('noAccountFound')}</p>
              </div>
            )}
            <div className="mt-auto pt-8">
              <Button onClick={onGoToLogin} fullWidth>
                {t('goToLogin')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ResultRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between py-3 ${!last ? 'border-border border-b' : ''}`}
    >
      <span className="text-ink3 text-[13px]">{label}</span>
      <span className="text-ink text-[14px] font-medium">{value}</span>
    </div>
  )
}
