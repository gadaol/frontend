import {
  PlaceFoodIcon,
  PlaceCafeIcon,
  PlaceLandmarkIcon,
  PlaceHotelIcon,
  PlaceShoppingIcon,
  PlaceNatureIcon,
  PlaceActivityIcon,
  PlacePinIcon,
} from '@/components/icons'

type IconComponent = typeof PlacePinIcon

export type CategoryStyle = {
  icon: IconComponent
  color: string      // text color (tailwind)
  bg: string         // background color (tailwind)
  hex: string        // hex for map markers etc.
  label: string      // 한국어 명칭
  hashLabel: string  // #명칭 형태
}

// DB place_categories.name 기반 (8개)
const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  식당: {
    icon: PlaceFoodIcon,
    color: 'text-[#EA6000]',
    bg: 'bg-[#FFF3EA]',
    hex: '#EA6000',
    label: '식당',
    hashLabel: '#식당',
  },
  카페: {
    icon: PlaceCafeIcon,
    color: 'text-[#7C4A1E]',
    bg: 'bg-[#FEF3C7]',
    hex: '#92400E',
    label: '카페',
    hashLabel: '#카페',
  },
  관광지: {
    icon: PlaceLandmarkIcon,
    color: 'text-[#C07A00]',
    bg: 'bg-[#FFFBEB]',
    hex: '#D97706',
    label: '관광지',
    hashLabel: '#관광지',
  },
  숙소: {
    icon: PlaceHotelIcon,
    color: 'text-[#1D5CE8]',
    bg: 'bg-[#EEF4FF]',
    hex: '#2563EB',
    label: '숙소',
    hashLabel: '#숙소',
  },
  쇼핑: {
    icon: PlaceShoppingIcon,
    color: 'text-[#6D28D9]',
    bg: 'bg-[#F3F0FF]',
    hex: '#7C3AED',
    label: '쇼핑',
    hashLabel: '#쇼핑',
  },
  자연: {
    icon: PlaceNatureIcon,
    color: 'text-[#15803D]',
    bg: 'bg-[#F0FDF4]',
    hex: '#16A34A',
    label: '자연',
    hashLabel: '#자연',
  },
  액티비티: {
    icon: PlaceActivityIcon,
    color: 'text-[#C81E32]',
    bg: 'bg-[#FFF1F2]',
    hex: '#DC2626',
    label: '액티비티',
    hashLabel: '#액티비티',
  },
  기타: {
    icon: PlacePinIcon,
    color: 'text-[#475569]',
    bg: 'bg-[#F3F6F9]',
    hex: '#64748B',
    label: '기타',
    hashLabel: '#기타',
  },
}

const DEFAULT_STYLE: CategoryStyle = CATEGORY_STYLES['기타']

/** DB category name(한국어) → CategoryStyle */
export function getCategoryStyle(name: string | null | undefined): CategoryStyle {
  return CATEGORY_STYLES[name ?? ''] ?? DEFAULT_STYLE
}

// 하위호환: 기존 Google type 배열 기반 조회
const GOOGLE_TYPE_TO_DB: Record<string, string> = {
  restaurant: '식당', food: '식당', meal_takeaway: '식당', meal_delivery: '식당',
  fast_food_restaurant: '식당', korean_restaurant: '식당', chinese_restaurant: '식당',
  japanese_restaurant: '식당', american_restaurant: '식당', seafood_restaurant: '식당',
  cafe: '카페', bakery: '카페', coffee: '카페', coffee_shop: '카페',
  tourist_attraction: '관광지', museum: '관광지', art_gallery: '관광지',
  point_of_interest: '관광지', landmark: '관광지', historical_place: '관광지',
  cultural_landmark: '관광지', monument: '관광지', palace: '관광지',
  castle: '관광지', shrine: '관광지', temple: '관광지', church: '관광지',
  zoo: '관광지', aquarium: '관광지',
  lodging: '숙소', hotel: '숙소', motel: '숙소',
  shopping_mall: '쇼핑', store: '쇼핑', clothing_store: '쇼핑',
  department_store: '쇼핑', convenience_store: '쇼핑', supermarket: '쇼핑',
  grocery_store: '쇼핑',
  park: '자연', natural_feature: '자연', campground: '자연',
  national_park: '자연', beach: '자연', forest: '자연',
  amusement_park: '액티비티', sports_complex: '액티비티', stadium: '액티비티',
  golf_course: '액티비티', bowling_alley: '액티비티',
}

/** Google Places API types 배열 → CategoryStyle */
export function getCategoryInfo(types: string[]): CategoryStyle {
  for (const type of types) {
    const dbName = GOOGLE_TYPE_TO_DB[type]
    if (dbName) return CATEGORY_STYLES[dbName] ?? DEFAULT_STYLE
  }
  return DEFAULT_STYLE
}

/** DB category name(한국어) → CategoryStyle (하위호환) */
export function getCategoryInfoByLabel(label: string): CategoryStyle {
  return getCategoryStyle(label)
}

/** Google Types → DB category name */
export function getDbCategory(types: string[]): string {
  for (const type of types) {
    if (GOOGLE_TYPE_TO_DB[type]) return GOOGLE_TYPE_TO_DB[type]
  }
  return '기타'
}

/** 지도 마커 hex 색상 */
export function getMarkerColor(types: string[]): string {
  return getCategoryInfo(types).hex
}
