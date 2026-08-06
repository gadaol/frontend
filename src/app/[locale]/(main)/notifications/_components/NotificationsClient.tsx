'use client'

import { useTransition } from 'react'
import { markAsRead, markAllAsRead } from '@/app/actions/notifications'

export type Notification = {
  id: string
  type: string
  payload: Record<string, unknown>
  is_read: boolean
  created_at: string | null
}

type IconConfig = { color: string; bg: string; icon: React.ReactNode }

function TripInviteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="8" cy="6" r="3.5" stroke="#1B6FF0" strokeWidth="1.4" />
      <path d="M2 17c0-3 2.7-5 6-5" stroke="#1B6FF0" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M14 11v6M11 14h6" stroke="#1B6FF0" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function VoteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2l1.5 4.5h4.5l-3.7 2.7 1.4 4.4L10 11l-3.7 2.6 1.4-4.4L4 6.5h4.5z"
        stroke="#F79009"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 10l4 4 10-8"
        stroke="#12B76A"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="#9099A8" strokeWidth="1.4" />
      <path d="M10 6v5M10 13.5v.5" stroke="#9099A8" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

const TYPE_CONFIG: Record<string, IconConfig> = {
  invite: { color: '#1B6FF0', bg: '#EBF2FF', icon: <TripInviteIcon /> },
  vote: { color: '#F79009', bg: '#FEF3C7', icon: <VoteIcon /> },
  edit: { color: '#12B76A', bg: '#D1FAE5', icon: <CheckIcon /> },
  system: { color: '#9099A8', bg: '#F5F7FA', icon: <InfoIcon /> },
}

function getConfig(type: string): IconConfig {
  return TYPE_CONFIG[type] ?? { color: '#9099A8', bg: '#F5F7FA', icon: <InfoIcon /> }
}

function getTitle(type: string, payload: Record<string, unknown>): string {
  const daysUntil = payload.days_until as number | undefined
  switch (type) {
    case 'invite':
      return '여행 초대가 도착했어요'
    case 'vote':
      return '새 후보 장소가 추가됐어요'
    case 'edit':
      return '일정에 장소가 추가됐어요'
    case 'system':
      if (daysUntil === 1) return '내일 여행이 시작돼요!'
      if (daysUntil === 3) return '3일 후 여행이 시작돼요'
      return '여행 알림'
    default:
      return (payload.message as string) ?? '새 알림이 있어요'
  }
}

function getDesc(type: string, payload: Record<string, unknown>): string {
  const tripName = (payload.trip_name as string) ?? '여행'
  const actorName = (payload.actor_name as string) ?? '누군가'
  const placeName = (payload.place_name as string) ?? ''
  switch (type) {
    case 'invite':
      return `${actorName}님이 ${tripName}에 초대했어요`
    case 'vote':
      return `${actorName}님이 ${tripName}에 ${placeName}을(를) 추가했어요`
    case 'edit':
      return `${tripName}에 ${placeName}이(가) 일정에 추가됐어요`
    case 'system':
      return `${tripName} 준비됐나요? 지금 일정을 확인해보세요`
    default:
      return ''
  }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금 전'
  if (min < 60) return `${min}분 전`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default function NotificationsClient({
  notifications,
  unreadCount,
}: {
  notifications: Notification[]
  unreadCount: number
}) {
  const [, startTransition] = useTransition()

  function handleRead(id: string) {
    startTransition(async () => {
      await markAsRead(id)
    })
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllAsRead()
    })
  }

  const newNotifs = notifications.filter((n) => !n.is_read)
  const oldNotifs = notifications.filter((n) => n.is_read)

  return (
    <div className="min-h-dvh bg-[#F5F6F8]">
      {/* 헤더 */}
      <div className="flex h-[54px] items-center justify-between border-b border-[#E8EAED] bg-white px-5">
        <span className="text-[22px] font-bold tracking-[-0.4px] text-[#0F1117]">알림</span>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} className="text-[13px] font-medium text-[#1B6FF0]">
            모두 읽음
          </button>
        )}
      </div>

      {/* 알림 없음 */}
      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-32">
          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#F5F6F8]">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 3a6 6 0 016 6v4l2.5 3.5H5.5L8 13V9a6 6 0 016-6z"
                stroke="#9099A8"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M11 20.5a3 3 0 006 0"
                stroke="#9099A8"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-[#0F1117]">알림이 없어요</p>
          <p className="text-[13px] text-[#9099A8]">여행 초대나 투표 알림이 여기에 표시돼요</p>
        </div>
      )}

      {/* 새 알림 */}
      {newNotifs.length > 0 && (
        <NotifGroup label="새 알림" notifications={newNotifs} onRead={handleRead} />
      )}

      {/* 이전 알림 */}
      {oldNotifs.length > 0 && (
        <NotifGroup label="이전" notifications={oldNotifs} onRead={handleRead} />
      )}
    </div>
  )
}

function NotifGroup({
  label,
  notifications,
  onRead,
}: {
  label: string
  notifications: Notification[]
  onRead: (id: string) => void
}) {
  return (
    <div className="px-4 pt-3">
      <p className="mb-2 text-[11px] font-semibold tracking-[1px] text-[#9099A8] uppercase">
        {label}
      </p>
      <div className="mb-4 flex flex-col gap-1.5">
        {notifications.map((n) => (
          <NotifItem key={n.id} notification={n} onRead={onRead} />
        ))}
      </div>
    </div>
  )
}

function NotifItem({
  notification: n,
  onRead,
}: {
  notification: Notification
  onRead: (id: string) => void
}) {
  const cfg = getConfig(n.type)
  const title = getTitle(n.type, n.payload)
  const desc = getDesc(n.type, n.payload)

  return (
    <div
      className="relative overflow-hidden rounded-[14px] border p-3.5"
      style={{
        backgroundColor: n.is_read ? '#fff' : '#F0F6FF',
        borderColor: n.is_read ? '#E8EAED' : '#C5DBFF',
      }}
      onClick={() => {
        if (!n.is_read) onRead(n.id)
      }}
    >
      {/* 미읽음 점 */}
      {!n.is_read && (
        <div className="absolute top-3.5 right-3.5 h-2 w-2 rounded-full bg-[#1B6FF0]" />
      )}

      <div className="flex gap-3">
        {/* 아이콘 */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]"
          style={{ backgroundColor: cfg.bg }}
        >
          {cfg.icon}
        </div>

        {/* 본문 */}
        <div className="min-w-0 flex-1 pr-4">
          <p className="text-[13px] leading-[1.4] font-semibold text-[#0F1117]">{title}</p>
          {desc && <p className="mt-0.5 text-[12px] leading-[1.5] text-[#515966]">{desc}</p>}
          <p className="mt-1.5 text-[11px] text-[#9099A8]">{timeAgo(n.created_at)}</p>

          {/* 여행 초대 — 수락/거절 버튼 */}
          {n.type === 'invite' && (
            <div className="mt-2.5 flex gap-1.5">
              <button className="flex-1 rounded-[8px] bg-[#1B6FF0] py-2 text-[12px] font-semibold text-white">
                수락
              </button>
              <button className="flex-1 rounded-[8px] border border-[#E8EAED] bg-[#F5F7FA] py-2 text-[12px] font-semibold text-[#515966]">
                거절
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
