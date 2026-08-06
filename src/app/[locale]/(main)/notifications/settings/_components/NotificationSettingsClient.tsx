'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { updateNotificationPrefs, type NotificationPrefs } from '@/app/actions/notifications'
import AppHeader from '@/components/common/AppHeader'

type PrefKey = keyof NotificationPrefs

const ITEMS: { key: PrefKey; iconBg: string; icon: React.ReactNode }[] = [
  {
    key: 'system',
    iconBg: 'var(--color-primary-light)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect
          x="2"
          y="3"
          width="14"
          height="13"
          rx="2"
          stroke="var(--color-primary)"
          strokeWidth="1.4"
        />
        <path
          d="M6 1v4M12 1v4M2 8h14"
          stroke="var(--color-primary)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: 'invite',
    iconBg: 'var(--color-primary-light)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="7" cy="6" r="3.5" stroke="var(--color-primary)" strokeWidth="1.4" />
        <path
          d="M1 17c0-3.31 2.69-6 6-6"
          stroke="var(--color-primary)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M13 11v6M10 14h6"
          stroke="var(--color-primary)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: 'vote',
    iconBg: 'var(--color-warning-light)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 2l1.6 4.8H16l-4.4 3.2 1.7 4.8L9 12l-4.3 2.8 1.7-4.8L2 6.8h5.4z"
          stroke="var(--color-warning)"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'edit',
    iconBg: 'var(--color-success-light)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect
          x="3"
          y="2"
          width="12"
          height="14"
          rx="2"
          stroke="var(--color-success)"
          strokeWidth="1.4"
        />
        <path
          d="M6 6h6M6 9h6M6 12h4"
          stroke="var(--color-success)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]

export default function NotificationSettingsClient({ prefs }: { prefs: NotificationPrefs }) {
  const t = useTranslations('notifications.settings')
  const [, startTransition] = useTransition()
  const [values, setValues] = useState<NotificationPrefs>(prefs)

  function toggle(key: PrefKey) {
    const next = { ...values, [key]: !values[key] }
    setValues(next)
    startTransition(async () => {
      await updateNotificationPrefs(next)
    })
  }

  return (
    <div className="bg-bg2 min-h-dvh">
      <AppHeader title={t('title')} onBack="router" border />

      <div className="border-border mx-4 mt-4 overflow-hidden rounded-2xl border bg-white">
        {ITEMS.map((item, idx) => (
          <div
            key={item.key}
            className={`flex items-center gap-3 px-4 py-3.5 ${idx < ITEMS.length - 1 ? 'border-bg2 border-b' : ''}`}
          >
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
              style={{ backgroundColor: item.iconBg }}
            >
              {item.icon}
            </div>

            <div className="flex-1">
              <p className="text-ink text-[14px] font-medium">{t(`${item.key}.label`)}</p>
              <p className="text-ink3 mt-0.5 text-[12px]">{t(`${item.key}.desc`)}</p>
            </div>

            <button
              role="switch"
              aria-checked={values[item.key]}
              onClick={() => toggle(item.key)}
              style={{
                position: 'relative',
                width: 48,
                height: 28,
                borderRadius: 14,
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                flexShrink: 0,
                backgroundColor: values[item.key] ? 'var(--color-primary)' : '#D0D3D9',
                transition: 'background-color 0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: 2,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transform: values[item.key] ? 'translateX(20px)' : 'translateX(0)',
                  transition: 'transform 0.2s',
                  display: 'block',
                }}
              />
            </button>
          </div>
        ))}
      </div>

      <p className="text-ink3 mt-3 px-5 text-[12px]">{t('footer')}</p>
    </div>
  )
}
