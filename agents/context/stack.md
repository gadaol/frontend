# 가다올 기술 스택

## 프론트엔드

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript (strict) |
| 스타일 | Tailwind CSS v4 |
| 상태관리 | Zustand v5 |
| 폼 | React Hook Form + Zod |
| UI 라이브러리 | shadcn/ui (예정) |

## 백엔드 / DB

| 항목 | 내용 |
|------|------|
| 플랫폼 | Supabase |
| DB | PostgreSQL (Supabase 관리형) |
| 인증 | Supabase Auth (auth.users) |
| 스토리지 | Supabase Storage |
| 실시간 | Supabase Realtime (postgres_changes) |

## 외부 서비스

| 서비스 | 용도 |
|--------|------|
| Google Maps API | 장소 검색, 지도 표시 |
| OpenAI API | AI 장소 추천 (v2) |
| Stripe | 구독 결제 (v2) |

## 배포

| 항목 | 내용 |
|------|------|
| 프론트 | Vercel |
| 백엔드 | Supabase (관리형) |

## 패키지 매니저

```
pnpm
```

## 주요 패키지

```json
{
  "dependencies": {
    "next": "16.x",
    "react": "19.x",
    "@supabase/supabase-js": "2.x",
    "@supabase/ssr": "0.x",
    "zustand": "5.x",
    "zod": "4.x",
    "react-hook-form": "7.x",
    "@hookform/resolvers": "5.x"
  },
  "devDependencies": {
    "typescript": "5.x",
    "tailwindcss": "4.x",
    "prettier": "3.x",
    "prettier-plugin-tailwindcss": "0.x",
    "eslint-config-next": "16.x"
  }
}
```

## 프로젝트 경로

```
/Users/min/Documents/min/saas/gadaol/front/
```

## 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=https://tshkrcsplasynnlntxoh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
