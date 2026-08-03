'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import axios from 'axios'

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

type Method = 'sms' | 'email'
type SmsStep = 'input' | 'otp' | 'result'
type EmailStep = 'input' | 'result'

interface AccountResult {
  found: boolean
  maskedEmail?: string
  maskedPhone?: string
  providers?: string[]
}

interface Props {
  onBack: () => void
  onGoToLogin: () => void
}

export default function FindAccountView({ onBack, onGoToLogin }: Props) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const [method, setMethod] = useState<Method>('sms')

  // SMS 상태
  const [smsStep, setSmsStep] = useState<SmsStep>('input')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [smsError, setSmsError] = useState<string | null>(null)

  // 이메일 상태
  const [emailStep, setEmailStep] = useState<EmailStep>('input')
  const [email, setEmail] = useState('')
  const [emailSearching, setEmailSearching] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  // 공통 결과
  const [result, setResult] = useState<AccountResult | null>(null)

  const handleSendOtp = async () => {
    if (!phone.trim()) return
    setSending(true)
    setSmsError(null)
    try {
      await axios.post('/api/find-account/send', { phone })
      setSmsStep('otp')
    } catch (err) {
      if (axios.isAxiosError(err)) setSmsError(err.response?.data?.error ?? tc('error'))
      else setSmsError(tc('error'))
    } finally {
      setSending(false)
    }
  }

  const handleVerifySms = async () => {
    if (!otp.trim()) return
    setVerifying(true)
    setSmsError(null)
    try {
      const { data } = await axios.post('/api/find-account/verify', { phone, code: otp })
      setResult(data)
      setSmsStep('result')
    } catch (err) {
      if (axios.isAxiosError(err)) setSmsError(err.response?.data?.error ?? tc('error'))
      else setSmsError(tc('error'))
    } finally {
      setVerifying(false)
    }
  }

  const handleFindByEmail = async () => {
    if (!email.trim()) return
    setEmailSearching(true)
    setEmailError(null)
    try {
      const { data } = await axios.post('/api/find-account/email', { email })
      setResult(data)
      setEmailStep('result')
    } catch (err) {
      if (axios.isAxiosError(err)) setEmailError(err.response?.data?.error ?? tc('error'))
      else setEmailError(tc('error'))
    } finally {
      setEmailSearching(false)
    }
  }

  const handleMethodChange = (m: Method) => {
    setMethod(m)
    setSmsStep('input')
    setEmailStep('input')
    setSmsError(null)
    setEmailError(null)
    setResult(null)
    setOtp('')
  }

  const isResult = (method === 'sms' && smsStep === 'result') || (method === 'email' && emailStep === 'result')
  const backAction = () => {
    if (method === 'sms') {
      if (smsStep === 'otp') return setSmsStep('input')
      if (smsStep === 'result') return setSmsStep('input')
    }
    if (method === 'email' && emailStep === 'result') return setEmailStep('input')
    onBack()
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="flex h-14 flex-shrink-0 items-center gap-1 border-b border-[#E8EAED] px-4">
        <button
          onClick={backAction}
          className="flex h-10 w-10 items-center justify-center"
          aria-label={tc('back')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#0F1117" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-[17px] font-semibold text-[#0F1117]">{t('findAccountTitle')}</span>
      </div>

      {/* 탭 */}
      {!isResult && (
        <div className="flex border-b border-[#E8EAED]">
          {(['sms', 'email'] as Method[]).map((m) => (
            <button
              key={m}
              onClick={() => handleMethodChange(m)}
              className={`flex-1 py-3 text-[14px] font-medium transition-colors ${
                method === m
                  ? 'border-b-2 border-[#1B6FF0] text-[#1B6FF0]'
                  : 'text-[#9099A8]'
              }`}
            >
              {m === 'sms' ? t('methodSms') : t('methodEmailTab')}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col px-5 py-6">
        {/* SMS 플로우 */}
        {method === 'sms' && smsStep === 'input' && (
          <>
            <p className="mb-6 text-[14px] leading-relaxed text-[#9099A8]">{t('findAccountDesc')}</p>
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
            {smsError && <span className="mt-2 text-[13px] text-[#F04438]">{smsError}</span>}
            <div className="mt-auto pt-8">
              <button
                onClick={handleSendOtp}
                disabled={sending || !phone.trim()}
                className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white disabled:opacity-50"
              >
                {sending ? t('otpSending') : t('sendOtp')}
              </button>
            </div>
          </>
        )}

        {method === 'sms' && smsStep === 'otp' && (
          <>
            <p className="mb-6 text-[14px] leading-relaxed text-[#9099A8]">
              <span className="font-medium text-[#0F1117]">{phone}</span>{t('otpSentDesc')}
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
            {smsError && <span className="mt-2 text-[13px] text-[#F04438]">{smsError}</span>}
            <button
              onClick={async () => { setOtp(''); setSmsError(null); await handleSendOtp() }}
              disabled={sending}
              className="mt-3 self-start text-[13px] font-medium text-[#1B6FF0] disabled:opacity-50"
            >
              {sending ? t('otpSending') : t('resendOtp')}
            </button>
            <div className="mt-auto pt-8">
              <button
                onClick={handleVerifySms}
                disabled={verifying || otp.length < 6}
                className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white disabled:opacity-50"
              >
                {verifying ? t('processing') : t('verifyOtp')}
              </button>
            </div>
          </>
        )}

        {/* 이메일 플로우 */}
        {method === 'email' && emailStep === 'input' && (
          <>
            <p className="mb-6 text-[14px] leading-relaxed text-[#9099A8]">{t('findAccountEmailDesc')}</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#0F1117]">{t('findAccountEmailLabel')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@gadaol.com"
                className="h-12 rounded-xl border border-[#E8EAED] px-3.5 text-[15px] text-[#0F1117] outline-none focus:border-[#1B6FF0] focus:ring-2 focus:ring-[#1B6FF0]/10"
              />
            </div>
            {emailError && <span className="mt-2 text-[13px] text-[#F04438]">{emailError}</span>}
            <div className="mt-auto pt-8">
              <button
                onClick={handleFindByEmail}
                disabled={emailSearching || !email.trim()}
                className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white disabled:opacity-50"
              >
                {emailSearching ? t('processing') : t('findAccountAction')}
              </button>
            </div>
          </>
        )}

        {/* 결과 */}
        {isResult && result && (
          <div className="flex flex-1 flex-col">
            {result.found ? (
              <>
                <h2 className="mb-6 text-[18px] font-bold text-[#0F1117]">{t('findAccountResultTitle')}</h2>
                <div className="rounded-2xl border border-[#E8EAED] p-5">
                  {method === 'sms' && result.maskedEmail && (
                    <ResultRow label={t('maskedEmailLabel')} value={result.maskedEmail} />
                  )}
                  {method === 'email' && result.maskedPhone && (
                    <ResultRow label={t('maskedPhoneLabel')} value={result.maskedPhone} />
                  )}
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
                <p className="text-[14px] text-[#9099A8]">
                  {method === 'email' ? t('noAccountFoundByEmail') : t('noAccountFound')}
                </p>
              </div>
            )}
            <div className="mt-auto pt-8">
              <button
                onClick={onGoToLogin}
                className="h-[52px] w-full rounded-xl bg-[#1B6FF0] text-[15px] font-medium text-white"
              >
                {t('goToLogin')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ResultRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3 ${!last ? 'border-b border-[#E8EAED]' : ''}`}>
      <span className="text-[13px] text-[#9099A8]">{label}</span>
      <span className="text-[14px] font-medium text-[#0F1117]">{value}</span>
    </div>
  )
}
