# 가다올 UI 에이전트


---

## 가다올 환경

- 프레임워크: Next.js 16 App Router
- 스타일: Tailwind CSS v4
- UI 라이브러리: shadcn/ui (예정)
- 상태관리: Zustand v5
- 폼: React Hook Form + Zod

## 화면 참조

`agents/context/design.md` 를 항상 먼저 읽을 것 — 컬러, 타이포, 컴포넌트 스펙 기준.
`agents/context/screen-design.md` 에서 화면 명세 확인.
`agents/context/conventions.md` 의 파일 구조/네이밍 따를 것.

## 라우트 그룹 구조

```
src/app/
├── (auth)/            # 비인증 라우트
│   ├── page.tsx       # 온보딩 /
│   └── auth/
│       └── page.tsx
├── (main)/            # 인증 필요 라우트
│   ├── layout.tsx     # 하단 네비게이션 포함
│   ├── home/
│   ├── trips/
│   │   ├── page.tsx
│   │   ├── new/
│   │   └── [id]/
│   │       ├── page.tsx
│   │       ├── edit/
│   │       ├── places/
│   │       └── invite/
│   ├── backlog/
│   ├── mypage/
│   └── notifications/
└── actions/
```

## 컴포넌트 역할 분리 원칙

**컴포넌트는 UI만, 로직은 훅으로.**

```tsx
// ✅ 올바른 구조
function TripCard({ trip, onPress }: TripCardProps) {
  return <div className="...">{trip.title}</div>  // UI만
}

function TripsPage() {
  const { trips, loading } = useTrips()  // 로직은 훅에서
  return <TripCard trip={trips[0]} />
}

// ❌ 금지: 컴포넌트 안에서 직접 데이터 페칭
function TripCard({ id }: { id: string }) {
  const [trip, setTrip] = useState()
  useEffect(() => { fetch(id).then(setTrip) }, [])  // 금지
}
```

### 훅 책임
- 데이터 페칭 / 서버 액션 호출
- 로딩 · 에러 상태 관리
- 비즈니스 로직

### 컴포넌트 책임
- props를 받아서 렌더링
- 사용자 이벤트를 props 콜백으로 위임
- 스타일 · 레이아웃

## 컴포넌트 파일 위치

```tsx
// 화면 전용 컴포넌트
src/app/(main)/trips/[id]/_components/TripHeader.tsx

// 공용 기능 컴포넌트
src/components/features/trip/TripCard.tsx

// 공용 기본 컴포넌트 (shadcn/ui 기반)
src/components/ui/Button.tsx
```

## 모바일 우선

- 기준 너비: 390px (iPhone 14)
- 하단 네비게이션: 홈 / 여행 / 백로그 / 마이페이지
- Safe area 고려: `pb-safe`, `pt-safe`

## 로딩/에러/빈 상태 필수 처리

각 화면마다 세 가지 상태 반드시 구현:
- 로딩: skeleton 또는 spinner
- 빈 상태: 안내 문구 + CTA
- 에러: 에러 메시지 + 재시도 버튼
