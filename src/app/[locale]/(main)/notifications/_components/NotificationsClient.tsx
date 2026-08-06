'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import {
  markAsRead,
  markAllAsRead,
  acceptTripInvite,
  declineTripInvite,
} from '@/app/actions/notifications'

export type Notification = {
  id: string
  type: string
  payload: Record<string, unknown>
  is_read: boolean
  created_at: string | null
}

type IconConfig = { bg: string; icon: React.ReactNode }

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

function EditIcon() {
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
  invite: { bg: '#EBF2FF', icon: <TripInviteIcon /> },
  vote: { bg: '#FEF3C7', icon: <VoteIcon /> },
  edit: { bg: '#D1FAE5', icon: <EditIcon /> },
  system: { bg: '#F5F7FA', icon: <InfoIcon /> },
}

function getConfig(type: string): IconConfig {
  return TYPE_CONFIG[type] ?? { bg: '#F5F7FA', icon: <InfoIcon /> }
}

function timeAgo(dateStr: string | null, locale: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return rtf.format(0, 'minute')
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return rtf.format(-hours, 'hour')
  const days = Math.floor(hours / 24)
  if (days < 7) return rtf.format(-days, 'day')
  return new Date(dateStr).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

export default function NotificationsClient({
  notifications: initialNotifications,
  unreadCount: _initialUnreadCount,
  userId,
}: {
  notifications: Notification[]
  unreadCount: number
  userId: string
}) {
  const t = useTranslations('notifications')
  const [, startTransition] = useTransition()
  const [notifList, setNotifList] = useState<Notification[]>(initialNotifications)

  const unreadCount = notifList.filter((n) => !n.is_read).length

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    const channel = supabase.channel(`notif-list-${Math.random().toString(36).slice(2, 9)}`)

    async function fetchAll() {
      const { data } = await supabase
        .from('notifications')
        .select('id, type, payload, is_read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (mounted && data) setNotifList(data as Notification[])
    }

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => fetchAll(),
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [userId])

  function handleRead(id: string) {
    setNotifList((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    startTransition(async () => {
      await markAsRead(id)
    })
  }

  function handleMarkAll() {
    setNotifList((prev) => prev.map((n) => ({ ...n, is_read: true })))
    startTransition(async () => {
      await markAllAsRead()
    })
  }

  const newNotifs = notifList.filter((n) => !n.is_read)
  const oldNotifs = notifList.filter((n) => n.is_read)

  return (
    <div className="min-h-dvh bg-[#F5F6F8]">
      <div className="flex h-[54px] items-center justify-between border-b border-[#E8EAED] bg-white px-5">
        <span className="text-[22px] font-bold tracking-[-0.4px] text-[#0F1117]">{t('title')}</span>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} className="text-[13px] font-medium text-[#1B6FF0]">
            {t('markAllRead')}
          </button>
        )}
      </div>

      {notifList.length === 0 && (
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
          <p className="text-[15px] font-semibold text-[#0F1117]">{t('emptyTitle')}</p>
          <p className="text-[13px] text-[#9099A8]">{t('emptyDesc')}</p>
        </div>
      )}

      {newNotifs.length > 0 && (
        <NotifGroup label={t('groupNew')} notifications={newNotifs} onRead={handleRead} />
      )}

      {oldNotifs.length > 0 && (
        <NotifGroup label={t('groupPrevious')} notifications={oldNotifs} onRead={handleRead} />
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
  const t = useTranslations('notifications')
  const router = useRouter()
  const locale = useLocale()
  const [pending, setPending] = useState<'accept' | 'decline' | null>(null)
  const [declined, setDeclined] = useState(false)

  const cfg = getConfig(n.type)
  const tripId = n.payload.trip_id as string | undefined
  const actor = (n.payload.actor_name as string) ?? ''
  const trip = (n.payload.trip_name as string) ?? ''
  const place = (n.payload.place_name as string) ?? ''
  const daysUntil = n.payload.days_until as number | undefined

  function getTitle(): string {
    switch (n.type) {
      case 'invite':
        return t('inviteTitle')
      case 'vote':
        return t('voteTitle')
      case 'edit':
        return t('editTitle')
      case 'system':
        if (daysUntil === 1) return t('systemTomorrow')
        if (daysUntil === 3) return t('systemInDays')
        return t('systemGeneric')
      default:
        return (n.payload.message as string) ?? t('defaultTitle')
    }
  }

  function getDesc(): string {
    switch (n.type) {
      case 'invite':
        return t('inviteDesc', { actor, trip })
      case 'vote':
        return t('voteDesc', { actor, trip, place })
      case 'edit':
        return t('editDesc', { trip, place })
      case 'system':
        return t('systemDesc', { trip })
      default:
        return ''
    }
  }

  function handleCardClick() {
    if (!n.is_read) onRead(n.id)
    if (!tripId) return
    if (n.type === 'vote') {
      router.push(`/${locale}/trips/${tripId}/vote`)
    } else if (n.type === 'edit' || n.type === 'system') {
      router.push(`/${locale}/trips/${tripId}`)
    }
  }

  async function handleAccept() {
    if (!tripId) return
    setPending('accept')
    await acceptTripInvite(n.id, tripId)
    router.push(`/${locale}/trips/${tripId}`)
  }

  async function handleDecline() {
    if (!tripId) return
    setPending('decline')
    await declineTripInvite(n.id, tripId)
    setDeclined(true)
    setPending(null)
  }

  const showInviteButtons = n.type === 'invite' && tripId && !n.is_read && !declined

  return (
    <div
      className="relative overflow-hidden rounded-[14px] border p-3.5"
      style={{
        backgroundColor: n.is_read ? '#fff' : '#F0F6FF',
        borderColor: n.is_read ? '#E8EAED' : '#C5DBFF',
        cursor: tripId ? 'pointer' : 'default',
      }}
      onClick={handleCardClick}
    >
      {!n.is_read && (
        <div className="absolute top-3.5 right-3.5 h-2 w-2 rounded-full bg-[#1B6FF0]" />
      )}

      <div className="flex gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]"
          style={{ backgroundColor: cfg.bg }}
        >
          {cfg.icon}
        </div>

        <div className="min-w-0 flex-1 pr-4">
          <p className="text-[13px] leading-[1.4] font-semibold text-[#0F1117]">{getTitle()}</p>
          {getDesc() && (
            <p className="mt-0.5 text-[12px] leading-[1.5] text-[#515966]">{getDesc()}</p>
          )}
          <p className="mt-1.5 text-[11px] text-[#9099A8]">{timeAgo(n.created_at, locale)}</p>

          {showInviteButtons && (
            <div className="mt-2.5 flex gap-1.5">
              <button
                disabled={!!pending}
                onClick={(e) => {
                  e.stopPropagation()
                  handleAccept()
                }}
                className="flex flex-1 items-center justify-center rounded-[8px] bg-[#1B6FF0] py-2 text-[12px] font-semibold text-white disabled:opacity-60"
              >
                {pending === 'accept' ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  t('accept')
                )}
              </button>
              <button
                disabled={!!pending}
                onClick={(e) => {
                  e.stopPropagation()
                  handleDecline()
                }}
                className="flex flex-1 items-center justify-center rounded-[8px] border border-[#E8EAED] bg-[#F5F7FA] py-2 text-[12px] font-semibold text-[#515966] disabled:opacity-60"
              >
                {pending === 'decline' ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#9099A8] border-t-transparent" />
                ) : (
                  t('decline')
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
