# 가다올 오케스트레이터


---

## 세션 시작 시 로드 순서

1. `AGENTS.md`
2. `agents/context/stack.md`
3. `agents/context/schema.md`
4. `agents/context/design.md`
5. 태스크에 따라 `agents/context/screen-design.md` 또는 `agents/context/api.md`

---

## 가다올 화면 개발 태스크 목록

MVP 우선순위 순:

| # | 화면 | 경로 | 필요 에이전트 |
|---|------|------|-------------|
| 1 | 온보딩 | `/` | UI |
| 2 | 로그인/회원가입 | `/auth` | UI, API |
| 3 | 홈 | `/home` | UI, API |
| 4 | 여행 목록 | `/trips` | UI, API |
| 5 | 여행 만들기 | `/trips/new` | UI, API, Type |
| 6 | 여행 상세 | `/trips/:id` | UI, API |
| 7 | 일정 편집 | `/trips/:id/edit` | UI, API (Realtime) |
| 8 | 장소 검색 | `/trips/:id/places` | UI, API |
| 9 | 장소 상세 | `/places/:id` | UI, API |
| 10 | 메이트 초대 | `/trips/:id/invite` | UI, API |
| 11 | 백로그 | `/backlog` | UI, API |
| 12 | 마이페이지 | `/mypage` | UI, API |
| 13 | 알림 | `/notifications` | UI, API (Realtime) |

---

## 화면 개발 표준 파이프라인

```
1. [DB 에이전트]   스키마 확인 / 신규 테이블 필요 시 마이그레이션
        ↓
2. [타입 에이전트]  database.types.ts 동기화 + 기능 타입/Zod 스키마
        ↓
3. [API 에이전트]   서버 액션 + 데이터 훅 구현
        ↓
4. [UI 에이전트]    page.tsx + _components/ 구현
```

---

## 에이전트 위임 템플릿

### DB
```
agents/db-agent.md 를 읽고:
[테이블] 관련 [작업 내용]
```

### 타입
```
agents/type-agent.md 를 읽고:
[기능] 타입 및 Zod 스키마 추가
```

### API
```
agents/api-agent.md 를 읽고:
[기능] 서버 액션 + 훅 구현
참고: agents/context/api.md
```

### UI
```
agents/ui-agent.md 를 읽고:
[화면명] 화면 구현
참고: agents/context/screen-design.md, agents/context/conventions.md
```

---

## 태스크 입력 예시

```
오케스트레이터야, 여행 목록 화면(/trips)을 만들어줘.
```

→ 오케스트레이터가 판단:
1. trips, trip_members 테이블 이미 존재 → DB 에이전트 스킵
2. TripWithMembers 타입 이미 존재 → 타입 에이전트 스킵
3. useTrips 훅 없음 → API 에이전트 실행
4. trips/page.tsx 없음 → UI 에이전트 실행
