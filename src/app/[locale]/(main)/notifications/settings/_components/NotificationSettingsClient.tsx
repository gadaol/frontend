'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateNotificationPrefs, type NotificationPrefs } from '@/app/actions/notifications'

const ITEMS: {
  key: keyof NotificationPrefs
  label: string
  desc: string
  iconBg: string
  icon: React.ReactNode
}[] = [
  {
    key: 'system',
    label: '다가오는 여행',
    desc: '출발 D-3, D-1에 알림을 보내드려요',
    iconBg: '#EBF2FF',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="3" width="14" height="13" rx="2" stroke="#1B6FF0" strokeWidth="1.4" />
        <path d="M6 1v4M12 1v4M2 8h14" stroke="#1B6FF0" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'invite',
    label: '여행 초대',
    desc: '다른 사람이 나를 여행에 초대할 때',
    iconBg: '#EBF2FF',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="7" cy="6" r="3.5" stroke="#1B6FF0" strokeWidth="1.4" />
        <path
          d="M1 17c0-3.31 2.69-6 6-6"
          stroke="#1B6FF0"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path d="M13 11v6M10 14h6" stroke="#1B6FF0" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'vote',
    label: '투표',
    desc: '후보 장소가 새로 추가됐을 때',
    iconBg: '#FEF3C7',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 2l1.6 4.8H16l-4.4 3.2 1.7 4.8L9 12l-4.3 2.8 1.7-4.8L2 6.8h5.4z"
          stroke="#F79009"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'edit',
    label: '일정 변경',
    desc: '여행 일정에 장소가 추가됐을 때',
    iconBg: '#D1FAE5',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="2" width="12" height="14" rx="2" stroke="#12B76A" strokeWidth="1.4" />
        <path d="M6 6h6M6 9h6M6 12h4" stroke="#12B76A" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function NotificationSettingsClient({ prefs }: { prefs: NotificationPrefs }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [values, setValues] = useState<NotificationPrefs>(prefs)

  function toggle(key: keyof NotificationPrefs) {
    const next = { ...values, [key]: !values[key] }
    setValues(next)
    startTransition(async () => {
      await updateNotificationPrefs(next)
    })
  }

  return (
    <div className="min-h-dvh bg-[#F5F6F8]">
      {/* 헤더 */}
      <div className="flex h-[54px] items-center gap-3 border-b border-[#E8EAED] bg-white px-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M12.5 5l-5 5 5 5"
              stroke="#0F1117"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="text-[17px] font-bold text-[#0F1117]">알림 설정</h1>
      </div>

      {/* 토글 목록 */}
      <div className="mx-4 mt-4 overflow-hidden rounded-2xl border border-[#E8EAED] bg-white">
        {ITEMS.map((item, idx) => (
          <div
            key={item.key}
            className={`flex items-center gap-3 px-4 py-3.5 ${idx < ITEMS.length - 1 ? 'border-b border-[#F5F6F8]' : ''}`}
          >
            {/* 아이콘 */}
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
              style={{ backgroundColor: item.iconBg }}
            >
              {item.icon}
            </div>

            {/* 텍스트 */}
            <div className="flex-1">
              <p className="text-[14px] font-medium text-[#0F1117]">{item.label}</p>
              <p className="mt-0.5 text-[12px] text-[#9099A8]">{item.desc}</p>
            </div>

            {/* 토글 */}
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
                backgroundColor: values[item.key] ? '#1B6FF0' : '#D0D3D9',
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

      <p className="mt-3 px-5 text-[12px] text-[#9099A8]">
        알림은 앱 내 알림함에 저장되며, 설정을 끄면 해당 알림이 생성되지 않아요.
      </p>
    </div>
  )
}
