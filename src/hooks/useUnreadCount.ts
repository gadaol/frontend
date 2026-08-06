'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUnreadCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true
    // 고유 채널명으로 strict mode 중복 구독 방지
    const channel = supabase.channel(`notif-unread-${Math.random().toString(36).slice(2, 9)}`)

    async function fetchCount(uid: string) {
      const { count: n } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('is_read', false)
      if (mounted) setCount(n ?? 0)
    }

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !mounted) return

      await fetchCount(user.id)
      if (!mounted) return

      channel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => fetchCount(user.id),
        )
        .subscribe()
    }

    init()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  return count
}
