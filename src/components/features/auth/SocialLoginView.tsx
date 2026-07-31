'use client'

import { createClient } from '@/lib/supabase/client'

interface Props {
  onEmailClick: () => void
}

export default function SocialLoginView({ onEmailClick }: Props) {
  const supabase = createClient()

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  const signInWithKakao = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[linear-gradient(170deg,#070E1A_0%,#0F2351_100%)]">
      <div className="px-7 pt-12 pb-8 text-center">
        <div className="mb-2 text-4xl font-extrabold tracking-tighter text-white">gadaol</div>
        <div className="text-sm text-white/45">함께 떠나는 여행 플래너</div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto rounded-t-[28px] bg-white px-6 pt-8 pb-10">
        <div className="mb-1 text-[22px] font-bold tracking-tight text-[#0F1117]">시작하기</div>
        <div className="mb-7 text-sm text-[#9099A8]">계속하려면 로그인 또는 회원가입하세요</div>

        <div className="flex flex-col gap-3">
          <button
            onClick={signInWithKakao}
            className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-[#FEE500] text-[15px] font-medium text-[#191919]"
          >
            <KakaoIcon />
            카카오로 계속하기
          </button>

          <button
            onClick={signInWithGoogle}
            className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl border border-[#E8EAED] bg-white text-[15px] font-medium text-[#0F1117]"
          >
            <GoogleIcon />
            Google로 계속하기
          </button>

          <div className="flex items-center gap-3 text-[13px] text-[#9099A8]">
            <span className="h-px flex-1 bg-[#E8EAED]" />
            또는
            <span className="h-px flex-1 bg-[#E8EAED]" />
          </div>

          <button
            onClick={onEmailClick}
            className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-[#0F1117] text-[15px] font-medium text-white"
          >
            <EmailIcon />
            이메일로 계속하기
          </button>
        </div>

        <p className="mt-5 text-center text-[12px] leading-relaxed text-[#9099A8]">
          계속하면{' '}
          <a href="#" className="text-[#1B6FF0]">
            이용약관
          </a>{' '}
          및{' '}
          <a href="#" className="text-[#1B6FF0]">
            개인정보 처리방침
          </a>
          에<br />
          동의하는 것으로 간주합니다.
        </p>
      </div>
    </div>
  )
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 1.5C4.86 1.5 1.5 4.14 1.5 7.38c0 2.09 1.32 3.93 3.31 4.97L3.9 15l3.6-2.37c.49.07.99.1 1.5.1 4.14 0 7.5-2.64 7.5-5.88S13.14 1.5 9 1.5z"
        fill="#191919"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6A7.8 7.8 0 0016.51 8z"
        fill="#4285F4"
      />
      <path
        d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.77-2.7.77a4.76 4.76 0 01-4.49-3.27H1.8v2.07A8 8 0 008.98 17z"
        fill="#34A853"
      />
      <path d="M4.49 10.55a4.8 4.8 0 010-3.1V5.38H1.8a8 8 0 000 7.24l2.69-2.07z" fill="#FBBC05" />
      <path
        d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.8 5.39l2.69 2.07a4.76 4.76 0 014.49-3.28z"
        fill="#EA4335"
      />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="4" width="16" height="11" rx="2" stroke="white" strokeWidth="1.5" />
      <path d="M1 6l8 5 8-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
