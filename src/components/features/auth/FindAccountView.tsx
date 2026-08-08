'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import api, { isApiError } from '@/lib/axios/client'
import Button from '@/components/ui/Button'
import PageLoading from '@/components/ui/PageLoading'

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

type Step = 'input' | 'otp' | 'result'

interface AccountEntry {
  maskedEmail: string | null
  providers: string[]
}

interface AccountResult {
  found: boolean
  accounts?: AccountEntry[]
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
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(180)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current)
    },
    [],
  )

  const handleSendOtp = async () => {
    if (!phone.trim()) return
    setSending(true)
    setError(null)
    try {
      await api.post('/api/find-account/send', { phone })
      setStep('otp')
      startTimer()
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
              <div className="mb-2 flex items-center justify-between">
                <label className="text-ink text-[13px] font-medium">{t('otpLabel')}</label>
                {timeLeft > 0 ? (
                  <span className="text-primary text-[13px] font-medium tabular-nums">
                    {formatTime(timeLeft)}
                  </span>
                ) : (
                  <span className="text-error text-[13px]">{t('otpExpired')}</span>
                )}
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder={t('otpPlaceholder')}
                disabled={timeLeft === 0}
                className={`text-ink disabled:text-ink3 h-12 rounded-xl border px-3.5 text-[15px] tracking-widest outline-none focus:ring-2 ${timeLeft > 0 ? 'border-primary focus:border-primary focus:ring-primary/10' : 'border-red-300'}`}
              />
              {timeLeft === 0 && <p className="text-error text-[12px]">{t('otpExpiredDesc')}</p>}
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
              <Button
                onClick={handleVerify}
                disabled={verifying || otp.length < 6 || timeLeft === 0}
                fullWidth
              >
                {verifying ? t('processing') : t('verifyOtp')}
              </Button>
            </div>
          </>
        )}

        {step === 'result' && result && (
          <div className="flex flex-1 flex-col">
            {result.found && result.accounts && result.accounts.length > 0 ? (
              <>
                <h2 className="text-ink mb-6 text-[18px] font-bold">
                  {t('findAccountResultTitle')}
                </h2>
                <div className="flex flex-col gap-3">
                  {result.accounts.map((account, i) => (
                    <div key={i} className="border-border rounded-2xl border p-5">
                      <ResultRow label={t('maskedEmailLabel')} value={account.maskedEmail ?? '-'} />
                      <ResultRow
                        label={t('loginMethodLabel')}
                        value={account.providers
                          .map((p) => {
                            if (p === 'google') return t('methodGoogle')
                            if (p === 'kakao') return t('methodKakao')
                            return t('methodEmail')
                          })
                          .join(', ')}
                        last
                      />
                    </div>
                  ))}
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
      <PageLoading visible={sending || verifying} />
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
