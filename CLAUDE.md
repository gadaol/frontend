# 가다올 (Gadaol) — Claude Code 컨텍스트

## 에이전트 프레임워크

이 프로젝트는 범용 에이전트 프레임워크를 사용합니다.
작업 시작 전 아래 파일을 로드하세요:

```
공통 규칙:      ~/Documents/min/agent/AGENTS.md
오케스트레이터: ~/Documents/min/agent/pipelines/orchestrator.md

가다올 컨텍스트:
  ~/Documents/min/saas/gadaol/agent-context/stack.md
  ~/Documents/min/saas/gadaol/agent-context/conventions.md
  ~/Documents/min/saas/gadaol/agent-context/schema.md
  ~/Documents/min/saas/gadaol/agent-context/screen-design.md
  ~/Documents/min/saas/gadaol/agent-context/api.md
```

## 핵심 정보

- 앱: 가다올 (gadaol.app) — 여행 메이트 실시간 공유 앱
- 스택: Next.js 16 + Supabase + Zustand + Tailwind v4
- DB: Supabase (PostgreSQL), auth.users 기반 인증

## 자주 쓰는 명령어

```bash
pnpm dev          # 개발 서버
pnpm typecheck    # 타입 체크
pnpm lint:fix     # lint 자동 수정
pnpm format       # prettier 포맷
```

## 규칙

- Server Component 기본, `'use client'` 최소화
- `database.types.ts` 직접 수정 금지
- `any` 타입 금지
- 서버 액션에서 반드시 auth 검증
