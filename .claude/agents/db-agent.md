# 가다올 DB 에이전트

베이스 규칙: ~/Documents/min/agent/AGENTS.md
베이스 역할: ~/Documents/min/agent/agents/db-agent.md

---

## 가다올 환경

- DB: Supabase PostgreSQL
- 인증: `auth.users` (별도 users 테이블 없음)
- 프로젝트: https://tshkrcsplasynnlntxoh.supabase.co
- 마이그레이션 위치: `supabase/migrations/`
- 타입 파일: `src/types/database.types.ts`

## 스키마 참조

`.claude/context/schema.md` 를 항상 먼저 읽을 것.

## 작업 절차

1. `.claude/context/schema.md` 에서 대상 테이블 확인
2. SQL 작성
3. RLS 활성화 + 정책 추가 (아래 패턴 참고)
4. 완료 후 타입 에이전트에 `database.types.ts` 재생성 요청

## RLS 패턴 (가다올 기준)

```sql
-- 인증 유저 본인만 접근
CREATE POLICY "owner_only" ON table_name
  FOR ALL USING (auth.uid() = user_id);

-- trip_members에 속한 유저만 여행 접근
CREATE POLICY "trip_member_access" ON trips
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_id = trips.id AND user_id = auth.uid()
    )
  );

-- 인증 유저 읽기
CREATE POLICY "auth_read" ON table_name
  FOR SELECT USING (auth.role() = 'authenticated');
```

## MVP 우선 테이블

profiles, trips, trip_members, trip_tags,
itinerary_days, itinerary_items, places, place_categories,
backlog_items, votes, notifications

## 타입 재생성 명령어

```bash
supabase gen types typescript --project-id tshkrcsplasynnlntxoh > src/types/database.types.ts
```
