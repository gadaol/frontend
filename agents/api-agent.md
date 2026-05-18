# 가다올 API 에이전트

베이스 규칙: ~/Documents/min/agent/AGENTS.md
베이스 역할: ~/Documents/min/agent/agents/api-agent.md

---

## 가다올 환경

- 백엔드: Supabase (커스텀 API 서버 없음)
- 서버 액션 위치: `src/app/actions/[feature].actions.ts`
- 훅 위치: `src/hooks/use[Feature].ts`
- Supabase 클라이언트: `@/lib/supabase/server` (서버), `@/lib/supabase/client` (클라이언트)

## API 참조

`agents/context/api.md` 를 먼저 읽을 것.

## 서버 액션 필수 패턴

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function actionName(input: InputType) {
  const supabase = await createClient()

  // 반드시 auth 검증
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('table_name')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/path')
  return data
}
```

## 클라이언트 훅 패턴

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Trip } from '@/types'

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('trips').select('*, trip_members(*)').then(({ data }) => {
      setTrips(data ?? [])
      setLoading(false)
    })
  }, [])

  return { trips, loading }
}
```

## Realtime 구독 패턴

```typescript
useEffect(() => {
  const supabase = createClient()
  const channel = supabase
    .channel(`trip-${tripId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'itinerary_items',
    }, (payload) => { /* 상태 업데이트 */ })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [tripId])
```

## 금지

- 클라이언트에서 `service_role` 키 접근 금지
- 서버 액션에서 auth 검증 생략 금지
- N+1 쿼리 금지 (`.select('*, relation(*)')` 활용)
