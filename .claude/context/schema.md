# 가다올 DB 스키마

Supabase PostgreSQL. 인증은 `auth.users` 사용 (별도 users 테이블 없음).
`profiles` 테이블이 `auth.users.id`를 FK로 참조.

---

## 테이블 목록

| 테이블 | 설명 | 우선순위 |
|--------|------|---------|
| `profiles` | 유저 프로필 | MVP |
| `subscriptions` | 구독 플랜 | v2 |
| `payment_logs` | 결제 내역 | v2 |
| `trips` | 여행 | MVP |
| `trip_members` | 여행 멤버 | MVP |
| `trip_tags` | 여행 태그 | MVP |
| `trip_reviews` | 여행 후기 | v2 |
| `itinerary_days` | 일정 일자 | MVP |
| `itinerary_items` | 일정 항목 | MVP |
| `places` | 장소 | MVP |
| `place_categories` | 장소 카테고리 | MVP |
| `place_reviews` | 장소 리뷰 | v2 |
| `backlog_items` | 백로그 | MVP |
| `votes` | 장소 투표 | MVP |
| `notifications` | 알림 | MVP |
| `user_preferences` | AI 선호도 | v2 |
| `place_interactions` | AI 학습용 행동 로그 | v2 |
| `recommendation_logs` | AI 추천 로그 | v2 |

---

## 테이블 상세

### profiles
```sql
id          uuid  PK, FK → auth.users.id
name        varchar
avatar_url  varchar
created_at  timestamp  default now()
updated_at  timestamp  default now()
```
RLS: 본인만 수정, 인증 유저는 읽기 가능

### trips
```sql
id          uuid  PK
owner_id    uuid  FK → auth.users.id
title       varchar  NOT NULL
cover_url   varchar
start_date  date
end_date    date
status      varchar  'planning' | 'ongoing' | 'completed'
created_at  timestamp
updated_at  timestamp
```
RLS: trip_members에 속한 유저만 접근

### trip_members
```sql
id       uuid  PK
trip_id  uuid  FK → trips.id
user_id  uuid  FK → auth.users.id
role     varchar  'owner' | 'editor' | 'viewer'
joined_at timestamp
```

### trip_tags
```sql
id       uuid  PK
trip_id  uuid  FK → trips.id
tag      varchar  '맛집' | '힐링' | '액티비티' | '도시' | '자연'
```

### itinerary_days
```sql
id          uuid  PK
trip_id     uuid  FK → trips.id
day_date    date  NOT NULL
day_number  int   NOT NULL  (1일차, 2일차...)
```

### itinerary_items
```sql
id           uuid  PK
day_id       uuid  FK → itinerary_days.id
place_id     uuid  FK → places.id
order_index  int   NOT NULL
memo         text
visit_time   time
```

### places
```sql
id               uuid  PK
google_place_id  varchar  UNIQUE
name             varchar  NOT NULL
address          varchar
lat              float
lng              float
category_id      uuid  FK → place_categories.id
created_at       timestamp
```

### place_categories
```sql
id    uuid  PK
name  varchar  '카페' | '식당' | '관광지' | '숙소' | '쇼핑'
icon  varchar
```

### backlog_items
```sql
id        uuid  PK
user_id   uuid  FK → auth.users.id
place_id  uuid  FK → places.id
trip_id   uuid  FK → trips.id  (어느 여행에서 못 간 곳)
memo      text
created_at timestamp
```
RLS: 본인만 접근

### votes
```sql
id         uuid  PK
trip_id    uuid  FK → trips.id
place_id   uuid  FK → places.id
user_id    uuid  FK → auth.users.id
vote_type  varchar  'like' | 'dislike'
created_at timestamp
```
UNIQUE(trip_id, place_id, user_id)

### notifications
```sql
id         uuid  PK
user_id    uuid  FK → auth.users.id
type       varchar  'invite' | 'vote' | 'edit' | 'system'
payload    jsonb
is_read    boolean  default false
created_at timestamp
```
RLS: 본인만 접근

### subscriptions (v2)
```sql
id         uuid  PK
user_id    uuid  FK → auth.users.id
plan       varchar  'free' | 'pro' | 'team'
status     varchar  'active' | 'cancelled' | 'expired'
expires_at timestamp
created_at timestamp
```

### user_preferences (v2)
```sql
id               uuid  PK
user_id          uuid  FK → auth.users.id  UNIQUE
category_weights jsonb  {"카페": 0.8, "자연": 0.3}
travel_style     jsonb  {"pace": "slow", "type": "food"}
updated_at       timestamp
```

---

## Enum 값 요약

| 필드 | 허용값 |
|------|--------|
| `trips.status` | `planning`, `ongoing`, `completed` |
| `trip_members.role` | `owner`, `editor`, `viewer` |
| `votes.vote_type` | `like`, `dislike` |
| `notifications.type` | `invite`, `vote`, `edit`, `system` |
| `subscriptions.plan` | `free`, `pro`, `team` |
| `subscriptions.status` | `active`, `cancelled`, `expired` |

---

## 전체 DBML

```dbml
// 원본: /Users/min/Documents/min/saas/gadaol/gadaol_erd.dbml
```
