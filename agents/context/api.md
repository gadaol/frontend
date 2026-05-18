# 가다올 API 명세

Supabase 기반. 커스텀 API 서버 없음.
데이터 변경은 Server Actions, 실시간은 Supabase Realtime 구독으로 처리.

---

## Supabase 클라이언트

```typescript
// 서버 컴포넌트 / Server Action
import { createClient } from '@/lib/supabase/server'

// 클라이언트 컴포넌트
import { createClient } from '@/lib/supabase/client'
```

---

## Server Actions

### 여행 (trips)

#### createTrip
```typescript
// src/app/actions/trip.actions.ts
export async function createTrip(data: {
  title: string
  start_date?: string
  end_date?: string
  cover_url?: string
}): Promise<Trip>
```

#### updateTrip
```typescript
export async function updateTrip(id: string, data: TripUpdate): Promise<Trip>
```

#### deleteTrip
```typescript
export async function deleteTrip(id: string): Promise<void>
```

#### getMyTrips
```typescript
// trip_members를 통해 내가 속한 여행 조회
export async function getMyTrips(): Promise<TripWithMembers[]>
```

---

### 일정 (itinerary)

#### addItineraryItem
```typescript
export async function addItineraryItem(data: {
  day_id: string
  place_id: string
  order_index: number
  memo?: string
  visit_time?: string
}): Promise<ItineraryItem>
```

#### reorderItineraryItems
```typescript
export async function reorderItineraryItems(
  items: Array<{ id: string; order_index: number }>
): Promise<void>
```

---

### 장소 (places)

#### upsertPlace
```typescript
// Google Places에서 가져온 장소를 DB에 저장 (없으면 생성)
export async function upsertPlace(data: {
  google_place_id: string
  name: string
  address?: string
  lat?: number
  lng?: number
  category_id?: string
}): Promise<Place>
```

---

### 백로그

#### addToBacklog
```typescript
export async function addToBacklog(data: {
  place_id: string
  trip_id?: string
  memo?: string
}): Promise<BacklogItem>
```

#### removeFromBacklog
```typescript
export async function removeFromBacklog(id: string): Promise<void>
```

---

### 투표

#### upsertVote
```typescript
export async function upsertVote(data: {
  trip_id: string
  place_id: string
  vote_type: 'like' | 'dislike'
}): Promise<void>
```

---

### 메이트 초대

#### inviteMember
```typescript
export async function inviteMember(data: {
  trip_id: string
  user_email: string
  role: 'editor' | 'viewer'
}): Promise<TripMember>
```

#### updateMemberRole
```typescript
export async function updateMemberRole(
  memberId: string,
  role: 'editor' | 'viewer'
): Promise<void>
```

---

### 알림

#### markNotificationRead
```typescript
export async function markNotificationRead(id: string): Promise<void>
export async function markAllNotificationsRead(): Promise<void>
```

---

## 클라이언트 훅

| 훅 | 반환 | 설명 |
|----|------|------|
| `useTrips()` | `{ trips, loading }` | 내 여행 목록 |
| `useTrip(id)` | `{ trip, loading }` | 여행 상세 |
| `useItinerary(tripId)` | `{ days, loading }` | 일정 |
| `useBacklog()` | `{ items, loading }` | 백로그 목록 |
| `useNotifications()` | `{ notifications, unreadCount }` | 알림 |
| `useVotes(tripId)` | `{ votes }` | 여행 투표 현황 |

---

## Supabase Realtime 구독

### 일정 편집 실시간 동기화
```typescript
// /trips/:id/edit 에서 사용
const channel = supabase
  .channel(`trip-${tripId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'itinerary_items',
    filter: `day_id=in.(${dayIds})`,
  }, handleChange)
  .subscribe()
```

### 알림 실시간 수신
```typescript
const channel = supabase
  .channel(`notifications-${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
  }, handleNewNotification)
  .subscribe()
```

---

## Supabase Auth

```typescript
// 소셜 로그인
await supabase.auth.signInWithOAuth({ provider: 'google' })

// 로그아웃
await supabase.auth.signOut()

// 현재 유저 (서버)
const { data: { user } } = await supabase.auth.getUser()
```
