# 가다올 디자인 시스템

Airbnb 디자인 시스템 기반, 여행 협업 앱에 맞게 커스터마이징.
참고 원본: https://getdesign.md/airbnb

---

## 핵심 정체성

- 따뜻한 흰 캔버스 위에 단일 브랜드 컬러
- 사진과 여백이 주인공, 타이포그래피는 보조
- 군더더기 없는 미니멀 UI, 감성적 온기
- 모바일 우선 (Airbnb는 데스크톱 우선이지만 가다올은 반대)

---

## 컬러 팔레트

### 브랜드 컬러
| 토큰 | 값 | 용도 |
|------|----|------|
| `--color-primary` | `#FF5A5F` | CTA 버튼, 강조, 아이콘 액센트 |
| `--color-primary-hover` | `#E04E53` | 호버 상태 |
| `--color-primary-light` | `#FFF0F0` | 배경 틴트, 선택 상태 |

### 서피스
| 토큰 | 값 | 용도 |
|------|----|------|
| `--color-bg` | `#FFFFFF` | 기본 배경 |
| `--color-bg-subtle` | `#F7F7F7` | 섹션 구분 배경 |
| `--color-bg-card` | `#FFFFFF` | 카드 배경 |

### 텍스트
| 토큰 | 값 | 용도 |
|------|----|------|
| `--color-text-primary` | `#222222` | 본문 |
| `--color-text-secondary` | `#717171` | 보조 텍스트 |
| `--color-text-tertiary` | `#B0B0B0` | 힌트, 비활성 |

### 시맨틱
| 토큰 | 값 | 용도 |
|------|----|------|
| `--color-success` | `#00A699` | 완료, 확인 |
| `--color-warning` | `#FFB400` | 경고 |
| `--color-error` | `#FF5A5F` | 에러 (primary와 동일) |
| `--color-border` | `#DDDDDD` | 구분선, 카드 테두리 |

---

## 타이포그래피

### 폰트 패밀리
```css
/* 한국어 */
font-family: 'Pretendard Variable', Pretendard, sans-serif;

/* 영문/숫자 (fallback) */
font-family: 'Plus Jakarta Sans', sans-serif;
```

> Airbnb Cereal은 커스텀 폰트라 대신 Pretendard 사용.
> Pretendard는 Inter 기반으로 Airbnb Cereal과 느낌이 유사함.

### 사이즈 스케일
| 토큰 | 크기 | 굵기 | 용도 |
|------|------|------|------|
| `text-display` | 28px | 700 | 온보딩 헤드라인 |
| `text-title-lg` | 22px | 600 | 화면 제목 |
| `text-title-md` | 18px | 600 | 섹션 제목 |
| `text-title-sm` | 16px | 600 | 카드 제목 |
| `text-body-lg` | 16px | 400 | 본문 |
| `text-body-md` | 14px | 400 | 보조 본문 |
| `text-body-sm` | 12px | 400 | 캡션, 메타 |
| `text-tag` | 10px | 500 | 뱃지, 태그 (uppercase) |

---

## 간격 시스템

8px 베이스, 2px 마이크로 스텝.

```
2px   micro (아이콘 내부 여백)
4px   xs
8px   sm
12px  md
16px  lg    (카드 내부 패딩)
24px  xl    (섹션 내부 여백)
32px  2xl
48px  3xl   (화면 상단 여백)
64px  4xl   (섹션 간 여백)
```

---

## 컴포넌트 스펙

### 버튼
```
primary:   bg #FF5A5F, text white, radius 8px, height 48px, weight 600
secondary: bg white, border #222222, text #222222, radius 8px
ghost:     bg transparent, text #222222, underline on hover
pill:      radius 9999px (검색바, 필터 태그)
disabled:  opacity 0.4
```

### 카드 (여행 카드)
```
radius: 12px
border: none (shadow 사용 안 함, Airbnb와 동일)
image:  aspect-ratio 4/3, radius 12px, object-fit cover
padding: 12px 0 (이미지 아래)
heart icon: top-right, 절대 위치
badge:  top-left (예: "D-3", "진행 중")
```

### 검색/입력
```
search bar: pill-shaped (radius 9999px), height 56px
            그림자: 0 2px 16px rgba(0,0,0,0.12)
input:      radius 8px, border #DDDDDD, focus border #222222
            height 48px, padding 12px 16px
```

### 바텀 네비게이션
```
height: 56px + safe-area-inset-bottom
background: white
border-top: 1px solid #EBEBEB
active icon: #FF5A5F
inactive icon: #717171
label: 10px, 500weight
```

### 뱃지 / 태그
```
여행 상태: radius 9999px, 12px 수평 패딩, 6px 수직 패딩
  planning: bg #F7F7F7, text #222222
  ongoing:  bg #FFF0F0, text #FF5A5F
  completed: bg #F0FFF9, text #00A699
```

### 그림자
```
Airbnb 원칙과 동일: 95%는 flat (shadow 없음)
hover/dropdown만: 0 2px 16px rgba(0,0,0,0.12)
검색바: 0 2px 16px rgba(0,0,0,0.12) (항상)
```

---

## 레이아웃

### 모바일 (기준 390px)
```
좌우 패딩: 16px
카드 그리드: 1열
바텀 네비: fixed bottom
헤더: 56px fixed top
```

### 태블릿 (744px+)
```
좌우 패딩: 24px
카드 그리드: 2열
```

### 데스크톱 (1024px+)
```
max-width: 1280px, 가운데 정렬
카드 그리드: 3–4열
```

---

## 사진/이미지 처리

- 커버 이미지: aspect-ratio 4/3, object-fit cover, radius 12px
- 아바타: 원형, 32px (소) / 40px (중) / 56px (대)
- 빈 상태 이미지: 중앙 정렬, 최대 240px 너비, opacity 0.6

---

## 모션

```
transition: 150ms ease (버튼, 아이콘)
transition: 200ms ease (카드 hover)
transition: 300ms ease (모달, 시트 슬라이드)
```
과한 애니메이션 금지. Airbnb와 동일하게 실용적 피드백 위주.

---

## Tailwind 커스텀 토큰 (tailwind.config.ts 기준)

```typescript
colors: {
  primary: {
    DEFAULT: '#FF5A5F',
    hover: '#E04E53',
    light: '#FFF0F0',
  },
  ink: '#222222',
  secondary: '#717171',
  tertiary: '#B0B0B0',
  border: '#DDDDDD',
  success: '#00A699',
  warning: '#FFB400',
  'bg-subtle': '#F7F7F7',
},
borderRadius: {
  pill: '9999px',
  card: '12px',
  btn: '8px',
},
fontFamily: {
  sans: ['Pretendard Variable', 'Pretendard', 'sans-serif'],
},
```

---

## 디자인 원칙

1. **사진이 주인공** — 텍스트로 설득하지 않고 이미지로 감정을 전달
2. **여백은 기능** — 빽빽한 UI 금지, 숨 쉬는 공간 확보
3. **단일 액센트** — `#FF5A5F` 외 다른 컬러 강조 최소화
4. **flat first** — 그림자는 검색바와 드롭다운에만
5. **모바일 손가락 친화** — 터치 타겟 최소 44px
