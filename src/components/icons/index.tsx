interface IconProps {
  size?: number
  className?: string
}

export function HomeIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className}>
      <path
        d="M3 9L11 2l8 7v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8 21v-8h6v8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TripsIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className}>
      <path
        d="M2 18L18 2L14 18L8 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PlacesIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path d="M21 21l-3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function BacklogIcon({ size = 24, className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className}>
      <rect
        x="2"
        y="7"
        width="18"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill={filled ? 'var(--color-primary-light)' : 'none'}
      />
      <path
        d="M7 7V5a2 2 0 0 1 4 0v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="11" cy="13" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function MypageIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className}>
      <circle cx="11" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 20c0-3.31 3.58-6 8-6s8 2.69 8 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function BellIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className}>
      <path
        d="M11 2a5 5 0 0 1 5 5v3l2 3H4l2-3V7a5 5 0 0 1 5-5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function ChevronLeftIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChevronRightIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function MapPinIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2C8.69 2 6 4.69 6 8c0 5 6 12 6 12s6-7 6-12c0-3.31-2.69-6-6-6z"
        fill="currentColor"
        fillOpacity=".3"
      />
      <circle cx="12" cy="8" r="2.5" fill="currentColor" />
    </svg>
  )
}

export function PlusIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className}>
      <path d="M11 4v14M4 11h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function ListIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className}>
      <path
        d="M16 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 6h6M8 10h6M8 14h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ExploreIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className}>
      <path
        d="M11 2C7.69 2 5 4.69 5 8c0 4.5 6 11 6 11s6-6.5 6-11c0-3.31-2.69-6-6-6z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="11" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function SearchIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 10.5l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function RestaurantIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M6 2v6a3 3 0 0 0 3 3v7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M9 2v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M14 2v4a3 3 0 0 1-3 3v9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function CafeIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M5 8h10l-1.5 7H6.5L5 8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M15 10h1.5a2 2 0 0 1 0 4H15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M4 17h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function HotelIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2" y="10" width="16" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 14h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 10V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="8" y="13" width="4" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

export function AttractionIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 2l2.09 4.26L17 7.27l-3.5 3.41.83 4.82L10 13.27l-4.33 2.23.83-4.82L3 7.27l4.91-.71L10 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ShoppingIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M3 6h14l-1.5 9a1 1 0 0 1-1 .9H5.5a1 1 0 0 1-1-.9L3 6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7 6V5a3 3 0 0 1 6 0v1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ParkIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 2C7 2 4.5 4.5 4.5 7.5c0 2 1 3.7 2.5 4.7L6 17h8l-1-4.8A5.5 5.5 0 0 0 10 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 12v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function NightlifeIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M7 3h8l-5 7h5l-9 7 3-7H4L7 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TransitIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="4" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 9h12" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7.5" cy="13" r="1" fill="currentColor" />
      <circle cx="12.5" cy="13" r="1" fill="currentColor" />
      <path
        d="M7 17l-1.5 0M13 17l1.5 0M10 15v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MedicalIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 7v6M7 10h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function GridIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" className={className}>
      <path
        d="M4 4h6v6H4zM12 4h6v6h-6zM4 12h6v6H4zM12 12h6v6h-6z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function XIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function CheckIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M3 8l3.5 3.5L13 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── 장소 카테고리 아이콘 ─────────────────────────────────────────────────────

// 식당 — 그릇 + 김 (bowl with steam)
export function PlaceFoodIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* 그릇 */}
      <path d="M3 13h18c0 5-4 8-9 8s-9-3-9-8z" fill="currentColor" />
      <rect x="8" y="20.5" width="8" height="1.5" rx=".75" fill="currentColor" opacity=".45" />
      {/* 김 */}
      <path d="M9 11.5C9 10 10.2 9.2 9.5 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14.5 11.5C14.5 10 13.3 9.2 14 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 10.5C12 9.2 13 8.5 12.3 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".5" />
    </svg>
  )
}

// 카페 — 테이크아웃 컵 (trapezoid cup)
export function PlaceCafeIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* 컵 몸통 */}
      <path d="M7.5 7h9l-1.8 12.5A1 1 0 0113.7 20h-3.4a1 1 0 01-1-.75L7.5 7z" fill="currentColor" />
      {/* 컵 뚜껑 */}
      <rect x="6.5" y="5" width="11" height="2.5" rx="1.25" fill="currentColor" />
      {/* 컵 슬리브 */}
      <rect x="7.8" y="12" width="8.4" height="2" rx=".5" fill="white" opacity=".2" />
      {/* 스트로우 */}
      <rect x="13" y="2" width="1.5" height="5.5" rx=".75" fill="currentColor" opacity=".6" />
    </svg>
  )
}

// 관광지 — 아치 게이트 (arch gate)
export function PlaceLandmarkIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* 상단 아치 */}
      <path d="M3 11C3 6.6 7 3 12 3s9 3.6 9 8v1H3v-1z" fill="currentColor" />
      {/* 왼쪽 기둥 */}
      <rect x="3" y="11" width="4.5" height="10" rx="1" fill="currentColor" />
      {/* 오른쪽 기둥 */}
      <rect x="16.5" y="11" width="4.5" height="10" rx="1" fill="currentColor" />
      {/* 아치 안 빈 공간 */}
      <path d="M7.5 11C7.5 8.5 9.5 7 12 7s4.5 1.5 4.5 4v1H7.5v-1z" fill="white" opacity=".85" />
    </svg>
  )
}

// 숙소 — 초승달 (crescent moon)
export function PlaceHotelIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" />
      <circle cx="17" cy="6" r="1.2" fill="currentColor" opacity=".45" />
      <circle cx="20" cy="9.5" r=".8" fill="currentColor" opacity=".3" />
    </svg>
  )
}

// 쇼핑 — 가격 태그 (price tag)
export function PlaceShoppingIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21.7 13.4l-9.1 9.1a1 1 0 01-1.4 0L2.5 13.8A1 1 0 012 13V4a2 2 0 012-2h9a1 1 0 01.7.3l8 8a1 1 0 010 1.4-.3.1z" fill="currentColor" />
      <circle cx="8" cy="8" r="2" fill="white" opacity=".85" />
    </svg>
  )
}

// 자연 — 겹친 산봉우리 (layered mountains)
export function PlaceNatureIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* 뒷 산 */}
      <path d="M1 21L9.5 7 18 21H1z" fill="currentColor" opacity=".45" />
      {/* 앞 산 */}
      <path d="M7 21L15.5 8 24 21H7z" fill="currentColor" />
      {/* 눈 */}
      <path d="M15.5 8l2 3.8-4 0z" fill="white" opacity=".75" />
    </svg>
  )
}

// 액티비티 — 트로피 (trophy)
export function PlaceActivityIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* 컵 몸통 */}
      <path d="M7 3h10l-1.5 9A5 5 0 0112 16a5 5 0 01-7.5-4L7 3z" fill="currentColor" />
      {/* 왼쪽 손잡이 */}
      <path d="M7 5.5H4.5A1.5 1.5 0 003 7v1A2 2 0 007 8" fill="currentColor" opacity=".5" />
      {/* 오른쪽 손잡이 */}
      <path d="M17 5.5h2.5A1.5 1.5 0 0121 7v1A2 2 0 0117 8" fill="currentColor" opacity=".5" />
      {/* 받침대 */}
      <rect x="10" y="16" width="4" height="3" rx=".5" fill="currentColor" />
      <rect x="7.5" y="19" width="9" height="2" rx="1" fill="currentColor" />
    </svg>
  )
}

// 기타 — 나침반 (compass)
export function PlacePinIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity=".15" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      {/* 북 방향 (밝음) */}
      <path d="M12 4l2.5 7H12 9.5L12 4z" fill="currentColor" />
      {/* 남 방향 (어두움) */}
      <path d="M12 20l-2.5-7H12h2.5L12 20z" fill="currentColor" opacity=".35" />
      <circle cx="12" cy="12" r="1.5" fill="white" />
    </svg>
  )
}
