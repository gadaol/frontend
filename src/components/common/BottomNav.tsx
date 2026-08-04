'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { BacklogIcon, HomeIcon, MypageIcon, PlacesIcon, TripsIcon } from '@/components/icons'

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
      icon: (active) => <HomeIcon size={22} className={active ? 'text-primary' : 'text-ink3'} />,
    },
    {
      key: 'trips',
      href: `/${locale}/trips`,
      icon: (active) => <TripsIcon size={22} className={active ? 'text-primary' : 'text-ink3'} />,
    },
    {
      key: 'places',
      href: `/${locale}/places`,
      icon: (active) => <PlacesIcon size={22} className={active ? 'text-primary' : 'text-ink3'} />,
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

  return (
    <nav className="border-border bg-bg flex-shrink-0 border-t">
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
