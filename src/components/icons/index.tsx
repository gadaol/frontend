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

// ─── 장소 카테고리 아이콘 (filled 스타일 — 메뉴 아이콘과 다른 형태) ───────────

export function PlaceFoodIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* 포크 (왼쪽) */}
      <path d="M4 3v7a3 3 0 003 3v8h2v-8a3 3 0 003-3V3h-1.5v5.5h-1V3h-2v5.5h-1V3H4z" fill="currentColor" />
      {/* 나이프 (오른쪽) */}
      <path d="M16 3c-1 1-2 3-2 6v12h4V9c0-3-1-5-2-6z" fill="currentColor" />
    </svg>
  )
}

export function PlaceCafeIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 8h14l-1.6 9.4A2 2 0 0115.4 19H8.6a2 2 0 01-2-.6L5 8z" fill="currentColor" />
      <path d="M15 11h2a2 2 0 010 4h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M9.5 4c0 0 1 .8 0 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".5" />
      <path d="M12.5 4c0 0 1 .8 0 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".5" />
    </svg>
  )
}

export function PlaceLandmarkIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="8" width="20" height="14" rx="2.5" fill="currentColor" />
      <rect x="8" y="5" width="8" height="4" rx="1.5" fill="currentColor" />
      <circle cx="12" cy="15" r="3.5" fill="white" opacity=".9" />
      <circle cx="12" cy="15" r="1.8" fill="currentColor" />
      <circle cx="18.5" cy="10" r="1.5" fill="white" opacity=".6" />
    </svg>
  )
}

export function PlaceHotelIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="13" width="20" height="8" rx="2" fill="currentColor" />
      <path d="M2 14V9a2 2 0 012-2h4.5a2 2 0 012 2v5" fill="currentColor" />
      <path d="M13.5 14V9a2 2 0 012-2H20a2 2 0 012 2v5" fill="currentColor" />
      <rect x="5" y="9" width="2.5" height="2" rx=".5" fill="white" opacity=".8" />
      <rect x="9" y="17" width="6" height="4" rx="1" fill="white" opacity=".5" />
    </svg>
  )
}

export function PlaceShoppingIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 8h16l-2 12a1 1 0 01-1 .9H7a1 1 0 01-1-.9L4 8z" fill="currentColor" />
      <path d="M9 8V6a3 3 0 016 0v2" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".8" />
    </svg>
  )
}

export function PlaceNatureIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3C7.5 3 4 6.7 4 11.2c0 3.5 2.1 6.5 5.1 7.9L12 11l2.9 8.1C17.9 17.7 20 14.7 20 11.2 20 6.7 16.5 3 12 3z" fill="currentColor" />
      <rect x="11" y="17" width="2" height="5" rx="1" fill="currentColor" opacity=".6" />
    </svg>
  )
}

export function PlaceActivityIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M13 2L4 14h7.5l-2.5 8L21 10h-8z" fill="currentColor" />
    </svg>
  )
}

export function PlacePinIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2C8.1 2 5 5.1 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-3.9-3.1-7-7-7z" fill="currentColor" />
      <circle cx="12" cy="9" r="2.5" fill="white" opacity=".85" />
    </svg>
  )
}
