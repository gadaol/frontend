'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

type Tab = {
  key: 'home' | 'trips' | 'places' | 'backlog' | 'mypage'
  href: string
  icon: (active: boolean) => React.ReactNode
}

export default function BottomNav() {
  const t = useTranslations('common.nav')
  const locale = useLocale()
  const pathname = usePathname()

  const tabs: Tab[] = [
    {
      key: 'home',
      href: `/${locale}/home`,
      icon: (active) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"
            stroke={active ? '#1B6FF0' : '#9099A8'}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M9 21V12h6v9"
            stroke={active ? '#1B6FF0' : '#9099A8'}
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      key: 'trips',
      href: `/${locale}/trips`,
      icon: (active) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect
            x="3"
            y="8"
            width="18"
            height="13"
            rx="2"
            stroke={active ? '#1B6FF0' : '#9099A8'}
            strokeWidth="1.7"
          />
          <path
            d="M8 8V6a4 4 0 0 1 8 0v2"
            stroke={active ? '#1B6FF0' : '#9099A8'}
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M3 13h18"
            stroke={active ? '#1B6FF0' : '#9099A8'}
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      key: 'places',
      href: `/${locale}/places`,
      icon: (active) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke={active ? '#1B6FF0' : '#9099A8'} strokeWidth="1.7" />
          <path
            d="M21 21l-3.5-3.5"
            stroke={active ? '#1B6FF0' : '#9099A8'}
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      key: 'backlog',
      href: `/${locale}/backlog`,
      icon: (active) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 3h14a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"
            stroke={active ? '#1B6FF0' : '#9099A8'}
            strokeWidth="1.7"
            strokeLinejoin="round"
            fill={active ? '#EBF2FF' : 'none'}
          />
        </svg>
      ),
    },
    {
      key: 'mypage',
      href: `/${locale}/mypage`,
      icon: (active) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="8"
            r="3.5"
            stroke={active ? '#1B6FF0' : '#9099A8'}
            strokeWidth="1.7"
          />
          <path
            d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
            stroke={active ? '#1B6FF0' : '#9099A8'}
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ]

  const isActive = (href: string) => {
    const segment = href.split('/').pop()!
    return pathname.includes(`/${segment}`)
  }

  return (
    <nav className="flex-shrink-0 border-t border-[#E8EAED] bg-white">
      <div className="flex items-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              {tab.icon(active)}
              <span
                className="text-[10px] leading-none font-medium"
                style={{ color: active ? '#1B6FF0' : '#9099A8' }}
              >
                {t(tab.key)}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
