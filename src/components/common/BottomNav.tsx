'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { BacklogIcon, HomeIcon, MypageIcon, TripsIcon } from '@/components/icons'
import { useUnreadCount } from '@/hooks/useUnreadCount'
import { useAssistantStore } from '@/lib/ai/store'
import CharacterAvatar from '@/components/features/ai/CharacterAvatar'

type NavTab = {
  key: 'home' | 'trips' | 'backlog' | 'mypage'
  href: string
  icon: (active: boolean) => React.ReactNode
}

export default function BottomNav() {
  const tai = useTranslations('ai')
  const t = useTranslations('common.nav')
  const locale = useLocale()
  const pathname = usePathname()
  useUnreadCount()
  const { open, character } = useAssistantStore()
  const [mounted, setMounted] = useState(false)
  // 서버·클라이언트 렌더 결과를 맞추기 위한 마운트 감지. 이 setState는 1회뿐이라 의도된 것.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const tabs: NavTab[] = [
    {
      key: 'home',
      href: `/${locale}/home`,
      icon: (active) => <HomeIcon size={22} className={active ? 'text-primary' : 'text-ink3'} />,
    },
    {
      key: 'trips',
      href: `/${locale}/trips`,
      icon: (active) => <TripsIcon size={22} className={active ? 'text-primary' : 'text-ink3'} />,
    },
    {
      key: 'backlog',
      href: `/${locale}/backlog`,
      icon: (active) => (
        <BacklogIcon size={22} filled={active} className={active ? 'text-primary' : 'text-ink3'} />
      ),
    },
    {
      key: 'mypage',
      href: `/${locale}/mypage`,
      icon: (active) => <MypageIcon size={22} className={active ? 'text-primary' : 'text-ink3'} />,
    },
  ]

  const isActive = (href: string) => {
    const segment = href.split('/').pop()!
    return pathname.includes(`/${segment}`)
  }

  const leftTabs = tabs.slice(0, 2)
  const rightTabs = tabs.slice(2)

  return (
    <nav
      className="border-border fixed right-0 bottom-0 left-0 z-50 border-t bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center">
        {leftTabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              <span className="relative inline-flex">{tab.icon(active)}</span>
              <span
                className={`text-[10px] leading-none font-medium ${active ? 'text-primary' : 'text-ink3'}`}
              >
                {t(tab.key)}
              </span>
            </Link>
          )
        })}

        {/* AI 중앙 버튼 */}
        <button
          onClick={() => open()}
          className="flex flex-1 flex-col items-center gap-1 py-2.5"
          aria-label={tai('openAssistant')}
        >
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full shadow-sm shadow-black/15">
            {mounted ? (
              <CharacterAvatar character={character} size="sm" />
            ) : (
              <div className="bg-bg2 h-8 w-8 rounded-full" />
            )}
          </span>
          <span className="text-ink3 text-[10px] leading-none font-medium">AI</span>
        </button>

        {rightTabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              <span className="relative inline-flex">{tab.icon(active)}</span>
              <span
                className={`text-[10px] leading-none font-medium ${active ? 'text-primary' : 'text-ink3'}`}
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
