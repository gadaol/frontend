# 가다올 코딩 컨벤션

## 파일 구조

```
src/
├── app/
│   ├── (auth)/           # 인증 불필요 라우트 그룹
│   │   ├── page.tsx      # 온보딩 /
│   │   └── auth/         # 로그인/회원가입
│   ├── (main)/           # 인증 필요 라우트 그룹
│   │   ├── home/
│   │   ├── trips/
│   │   ├── backlog/
│   │   ├── mypage/
│   │   └── notifications/
│   └── actions/          # Server Actions
├── components/
│   ├── ui/               # shadcn/ui 기반 기본 컴포넌트
│   └── features/         # 기능별 컴포넌트
│       ├── trip/
│       ├── place/
│       ├── backlog/
│       └── notification/
├── hooks/                # 커스텀 훅 (use*.ts)
├── stores/               # Zustand store (use*Store.ts)
├── lib/
│   └── supabase/
│       ├── client.ts     # 브라우저 클라이언트
│       ├── server.ts     # 서버 클라이언트
│       └── middleware.ts
└── types/
    ├── database.types.ts # Supabase 자동 생성 (수정 금지)
    └── index.ts          # 공용 타입 re-export
```

## 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 파일 | PascalCase | `TripCard.tsx` |
| 훅 | camelCase + `use` 접두사 | `useTrips.ts` |
| Zustand store | camelCase + `Store` | `useTripStore.ts` |
| 서버 액션 파일 | camelCase | `trip.actions.ts` |
| 타입/인터페이스 | PascalCase | `TripWithMembers` |
| 상수 | UPPER_SNAKE_CASE | `MAX_TRIP_MEMBERS` |

## 컴포넌트 규칙

- `'use client'`는 이벤트 핸들러, useState/useEffect, 브라우저 API 사용 시에만
- Server Component 기본, Client Component 예외
- 페이지 레벨(`page.tsx`)에서 데이터 페칭 후 props로 전달
- 화면 전용 컴포넌트는 `app/[route]/_components/` 에 배치

## Prettier 규칙

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

## 임포트 순서

1. `react`, `next`
2. 외부 라이브러리
3. `@/` 절대 경로
4. 상대 경로

## Git 커밋 메시지

```
feat: 기능 추가
fix: 버그 수정
refactor: 리팩토링
style: 스타일/포맷
chore: 빌드/설정/의존성
```
