import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const PROVIDERS = ['kakao', 'google', 'email'] as const
type Provider = (typeof PROVIDERS)[number]

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const locale = await getLocale()
  if (!user) redirect(`/${locale}`)

  const t = await getTranslations('mypage')

  const provider = (user.app_metadata?.provider ?? 'email') as Provider

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, phone')
    .eq('id', user.id)
    .single()

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: links } = await adminClient
    .from('account_links')
    .select('linked_provider')
    .eq('primary_user_id', user.id)

  const linkedProviders = new Set((links ?? []).map((l) => l.linked_provider as Provider))
  linkedProviders.add(provider)

  const displayName = profile?.name ?? user.email ?? ''
  const email = user.email ?? ''
  const phone = profile?.phone ?? ''
  const initials = displayName.trim() ? displayName.trim()[0].toUpperCase() : '?'

  return (
    <div className="min-h-dvh bg-[#F5F6F8]">
      <div className="sticky top-0 z-10 flex h-[56px] items-center border-b border-[#E8EAED] bg-white px-5">
        <h1 className="text-[17px] font-bold text-[#0F1117]">{t('title')}</h1>
      </div>

      <div className="px-5 pt-6">
        {/* Profile */}
        <div className="mb-4 flex items-center gap-4 rounded-2xl bg-white px-5 py-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1B6FF0] to-[#0D3E8A] text-[22px] font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[16px] font-semibold text-[#0F1117]">{displayName}</div>
            <div className="truncate text-[13px] text-[#9099A8]">{email}</div>
          </div>
        </div>

        {/* Linked accounts */}
        <div className="mb-4 rounded-2xl bg-white px-5 py-4">
          <div className="mb-3 text-[13px] font-semibold text-[#9099A8]">{t('linkedAccounts')}</div>
          <div className="divide-y divide-[#F5F6F8]">
            {PROVIDERS.map((p) => {
              const connected = linkedProviders.has(p)
              return (
                <div key={p} className="flex items-center gap-3 py-3">
                  <ProviderIcon provider={p} />
                  <span className="flex-1 text-[15px] text-[#0F1117]">{t(`provider.${p}`)}</span>
                  {connected ? (
                    <span className="rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[12px] font-medium text-[#2E7D32]">
                      {t('connected')}
                    </span>
                  ) : (
                    <span className="text-[13px] font-medium text-[#1B6FF0]">{t('connect')}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Phone */}
        <div className="rounded-2xl bg-white px-5 py-4">
          <div className="mb-3 text-[13px] font-semibold text-[#9099A8]">{t('phoneNumber')}</div>
          <div className="flex items-center gap-3">
            <span className="flex-1 text-[15px] text-[#0F1117]">
              {phone || <span className="text-[#C5CAD3]">{t('noPhone')}</span>}
            </span>
            {phone ? (
              <span className="text-[13px] font-medium text-[#1B6FF0]">{t('changePhone')}</span>
            ) : (
              <span className="text-[13px] font-medium text-[#1B6FF0]">{t('verifyPhone')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === 'kakao') {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FEE500]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8 1.6C4.686 1.6 2 3.72 2 6.32c0 1.67.993 3.14 2.5 4.013l-.638 2.36a.2.2 0 0 0 .297.22L7.01 11.16c.327.04.66.062 1 .062 3.314 0 6-2.12 6-4.72S11.314 1.6 8 1.6z"
            fill="#3C1E1E"
          />
        </svg>
      </div>
    )
  }
  if (provider === 'google') {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8EAED]">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path
            d="M15.68 8.18c0-.57-.05-1.12-.14-1.64H8v3.1h4.3a3.67 3.67 0 0 1-1.59 2.41v2h2.57c1.5-1.38 2.37-3.42 2.37-5.87z"
            fill="#4285F4"
          />
          <path
            d="M8 16c2.16 0 3.97-.72 5.29-1.94l-2.57-2c-.72.48-1.63.76-2.72.76-2.09 0-3.86-1.41-4.49-3.31H.86v2.06A8 8 0 0 0 8 16z"
            fill="#34A853"
          />
          <path
            d="M3.51 9.51A4.82 4.82 0 0 1 3.26 8c0-.52.09-1.03.25-1.51V4.43H.86A8 8 0 0 0 0 8c0 1.29.31 2.51.86 3.57l2.65-2.06z"
            fill="#FBBC05"
          />
          <path
            d="M8 3.18c1.18 0 2.23.41 3.06 1.2l2.3-2.3A8 8 0 0 0 8 0 8 8 0 0 0 .86 4.43L3.51 6.5C4.14 4.6 5.91 3.18 8 3.18z"
            fill="#EA4335"
          />
        </svg>
      </div>
    )
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F6F8]">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 12.5c0-2.21 2.24-4 5-4s5 1.79 5 4"
          stroke="#9099A8"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
