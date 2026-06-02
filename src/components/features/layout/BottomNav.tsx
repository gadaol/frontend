'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, Bookmark, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/home', label: '홈', icon: Home },
  { href: '/trips', label: '여행', icon: Map },
  { href: '/backlog', label: '백로그', icon: Bookmark },
  { href: '/mypage', label: '마이', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="sticky bottom-0 z-50 border-t border-border bg-white">
      <ul className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-tertiary hover:text-secondary',
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
      {/* iOS safe area */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
