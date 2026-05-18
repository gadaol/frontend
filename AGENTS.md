<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# 가다올 (Gadaol) — AI 에이전트 규칙

여행 메이트 실시간 공유 앱. B2C, 글로벌 + 국내.
슬로건: "같이 가다, 함께 올게"

---

## 프로젝트 핵심 정보

- 스택: Next.js 16 (App Router) + Supabase + Zustand v5 + Tailwind CSS v4
- DB: Supabase PostgreSQL, `auth.users` 기반 인증
- Supabase 프로젝트: `tshkrcsplasynnlntxoh`
- 패키지 매니저: pnpm

## 에이전트 파일 구조

```
agents/
├── context/             ← 읽기 전용 프로젝트 데이터
│   ├── stack.md         ← 기술 스택 상세
│   ├── schema.md        ← DB 스키마 (17개 테이블)
│   ├── screen-design.md ← 16개 화면 명세
│   ├── api.md           ← Server Actions + 훅 + Realtime
│   ├── conventions.md   ← 파일 구조, 네이밍
│   └── design.md        ← 디자인 시스템 (Airbnb 기반)
├── db-agent.md
├── ui-agent.md
├── type-agent.md
├── api-agent.md
└── pipelines/
    └── orchestrator.md
```

## 화면 개발 시작하는 법

```
agents/pipelines/orchestrator.md 를 읽고 [화면명] 화면을 만들어줘
```

역할별 직접 호출:
```
agents/ui-agent.md 를 읽고 [컴포넌트] 만들어줘
agents/api-agent.md 를 읽고 [기능] 서버 액션 구현해줘
agents/db-agent.md 를 읽고 [테이블] 마이그레이션 작성해줘
```

---

## 공통 코딩 규칙

### TypeScript
- `any` 타입 금지 — `unknown` + 타입 가드 사용
- `src/types/database.types.ts` 직접 수정 금지 (Supabase CLI 재생성)
- DB 타입은 `src/types/index.ts` 에서 파생

### Next.js
- Server Component 기본, `'use client'` 최소화
- 라우트 그룹: `(auth)/` 비인증, `(main)/` 인증 필요
- 서버 액션 위치: `src/app/actions/[feature].actions.ts`
- 훅 위치: `src/hooks/use[Feature].ts`

### Supabase
- 서버 액션에서 반드시 `auth.getUser()` 검증
- RLS 없이 테이블 공개 금지
- N+1 쿼리 금지 — `.select('*, relation(*)')` 활용

### UI / 훅 분리
- 컴포넌트는 UI(렌더링)만 담당, 데이터 페칭·비즈니스 로직은 훅으로
- 컴포넌트 안에서 직접 fetch / supabase 호출 금지
- 이벤트는 props 콜백으로 위임

### 코드 품질
- 주석은 WHY가 비자명할 때만
- 에러 핸들링은 시스템 경계(유저 입력, 외부 API)에서만
- 보안 취약점(XSS, SQL injection) 도입 금지

## 자주 쓰는 명령어

```bash
pnpm dev          # 개발 서버
pnpm typecheck    # 타입 체크
pnpm lint:fix     # lint 자동 수정
pnpm format       # prettier 포맷
```
