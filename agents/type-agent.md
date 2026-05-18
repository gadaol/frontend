# 가다올 타입 에이전트


---

## 가다올 환경

- 타입 소스: `src/types/database.types.ts` (Supabase 자동 생성)
- 공용 타입: `src/types/index.ts`
- 기능별 타입: `src/types/[feature].types.ts`

## 스키마 참조

`agents/context/schema.md` 를 먼저 읽을 것.

## 현재 정의된 타입 (src/types/index.ts)

```typescript
Profile, Trip, TripInsert, TripMember,
BacklogItem, Notification,
TripWithMembers, TripStatus, MemberRole, NotificationType
```

## 타입 파생 패턴

```typescript
import type { Database } from '@/types/database.types'

type Trip = Database['public']['Tables']['trips']['Row']
type TripInsert = Database['public']['Tables']['trips']['Insert']
type TripUpdate = Database['public']['Tables']['trips']['Update']

// 조인 타입
type TripWithMembers = Trip & { trip_members: TripMember[] }
```

## Zod 스키마 위치

폼 검증 스키마는 해당 기능 컴포넌트 또는 `src/lib/validations/` 에 배치:

```typescript
// src/lib/validations/trip.ts
export const createTripSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})
export type CreateTripInput = z.infer<typeof createTripSchema>
```

## 금지

- `any` 사용 금지
- `database.types.ts` 직접 수정 금지
- 중복 타입 정의 금지 — DB 타입에서 파생할 것
