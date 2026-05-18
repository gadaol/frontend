# 가다올 (Gadaol) — Claude Code 컨텍스트

## 에이전트 파일 위치

```
agents/
├── context/            ← 프로젝트 데이터
│   ├── stack.md
│   ├── conventions.md
│   ├── schema.md
│   ├── screen-design.md
│   └── api.md
├── db-agent.md
├── ui-agent.md
├── type-agent.md
├── api-agent.md
└── pipelines/
    └── orchestrator.md
```

## 화면 개발 시작하는 법

```
agents/pipelines/orchestrator.md 를 읽고
[화면명] 화면을 만들어줘
```

## 핵심 정보

- 앱: 가다올 (gadaol.app) — 여행 메이트 실시간 공유 앱
- 스택: Next.js 16 + Supabase + Zustand + Tailwind v4
- Supabase 프로젝트: tshkrcsplasynnlntxoh

## 자주 쓰는 명령어

```bash
pnpm dev          # 개발 서버
pnpm typecheck    # 타입 체크
pnpm lint:fix     # lint 자동 수정
pnpm format       # prettier 포맷
```

## 규칙

- Server Component 기본, `'use client'` 최소화
- `src/types/database.types.ts` 직접 수정 금지
- `any` 타입 금지
- 서버 액션에서 반드시 auth 검증
