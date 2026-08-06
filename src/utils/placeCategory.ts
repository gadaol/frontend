import {
  RestaurantIcon,
  CafeIcon,
  HotelIcon,
  AttractionIcon,
  ShoppingIcon,
  ParkIcon,
  NightlifeIcon,
  TransitIcon,
  MedicalIcon,
  MapPinIcon,
} from '@/components/icons'

type IconComponent = typeof MapPinIcon

type Category = {
  icon: IconComponent
  color: string // text color
  bg: string // background color
  label: string
}

const CATEGORY_MAP: Record<string, Category> = {
  restaurant: {
    icon: RestaurantIcon,
    color: 'text-[#E85D04]',
    bg: 'bg-[#FFF0E6]',
    label: '음식점',
  },
  food: { icon: RestaurantIcon, color: 'text-[#E85D04]', bg: 'bg-[#FFF0E6]', label: '음식점' },
  meal_takeaway: {
    icon: RestaurantIcon,
    color: 'text-[#E85D04]',
    bg: 'bg-[#FFF0E6]',
    label: '테이크아웃',
  },
  meal_delivery: {
    icon: RestaurantIcon,
    color: 'text-[#E85D04]',
    bg: 'bg-[#FFF0E6]',
    label: '배달',
  },
  bakery: { icon: CafeIcon, color: 'text-[#92400E]', bg: 'bg-warning-light', label: '베이커리' },
  cafe: { icon: CafeIcon, color: 'text-[#92400E]', bg: 'bg-warning-light', label: '카페' },
  coffee: { icon: CafeIcon, color: 'text-[#92400E]', bg: 'bg-warning-light', label: '카페' },
  lodging: { icon: HotelIcon, color: 'text-primary', bg: 'bg-[#EBF1FE]', label: '숙소' },
  hotel: { icon: HotelIcon, color: 'text-primary', bg: 'bg-[#EBF1FE]', label: '호텔' },
  motel: { icon: HotelIcon, color: 'text-primary', bg: 'bg-[#EBF1FE]', label: '모텔' },
  tourist_attraction: {
    icon: AttractionIcon,
    color: 'text-[#D97706]',
    bg: 'bg-warning-light',
    label: '관광지',
  },
  point_of_interest: {
    icon: AttractionIcon,
    color: 'text-[#D97706]',
    bg: 'bg-warning-light',
    label: '관광지',
  },
  landmark: {
    icon: AttractionIcon,
    color: 'text-[#D97706]',
    bg: 'bg-warning-light',
    label: '관광지',
  },
  museum: {
    icon: AttractionIcon,
    color: 'text-[#D97706]',
    bg: 'bg-warning-light',
    label: '박물관',
  },
  art_gallery: {
    icon: AttractionIcon,
    color: 'text-[#D97706]',
    bg: 'bg-warning-light',
    label: '갤러리',
  },
  amusement_park: {
    icon: AttractionIcon,
    color: 'text-[#D97706]',
    bg: 'bg-warning-light',
    label: '테마파크',
  },
  shopping_mall: {
    icon: ShoppingIcon,
    color: 'text-[#7C3AED]',
    bg: 'bg-[#EDE9FE]',
    label: '쇼핑몰',
  },
  store: { icon: ShoppingIcon, color: 'text-[#7C3AED]', bg: 'bg-[#EDE9FE]', label: '상점' },
  clothing_store: {
    icon: ShoppingIcon,
    color: 'text-[#7C3AED]',
    bg: 'bg-[#EDE9FE]',
    label: '의류',
  },
  department_store: {
    icon: ShoppingIcon,
    color: 'text-[#7C3AED]',
    bg: 'bg-[#EDE9FE]',
    label: '백화점',
  },
  park: { icon: ParkIcon, color: 'text-[#059669]', bg: 'bg-success-light', label: '공원' },
  natural_feature: {
    icon: ParkIcon,
    color: 'text-[#059669]',
    bg: 'bg-success-light',
    label: '자연',
  },
  campground: { icon: ParkIcon, color: 'text-[#059669]', bg: 'bg-success-light', label: '캠핑' },
  night_club: { icon: NightlifeIcon, color: 'text-[#DB2777]', bg: 'bg-[#FCE7F3]', label: '나이트' },
  bar: { icon: NightlifeIcon, color: 'text-[#DB2777]', bg: 'bg-[#FCE7F3]', label: '바' },
  subway_station: {
    icon: TransitIcon,
    color: 'text-[#0891B2]',
    bg: 'bg-[#CFFAFE]',
    label: '지하철',
  },
  train_station: {
    icon: TransitIcon,
    color: 'text-[#0891B2]',
    bg: 'bg-[#CFFAFE]',
    label: '기차역',
  },
  bus_station: { icon: TransitIcon, color: 'text-[#0891B2]', bg: 'bg-[#CFFAFE]', label: '버스' },
  airport: { icon: TransitIcon, color: 'text-[#0891B2]', bg: 'bg-[#CFFAFE]', label: '공항' },
  hospital: { icon: MedicalIcon, color: 'text-[#DC2626]', bg: 'bg-[#FEE2E2]', label: '병원' },
  pharmacy: { icon: MedicalIcon, color: 'text-[#DC2626]', bg: 'bg-[#FEE2E2]', label: '약국' },
}

const DEFAULT_CATEGORY: Category = {
  icon: MapPinIcon,
  color: 'text-primary',
  bg: 'bg-[#EBF1FE]',
  label: '장소',
}

export function getCategoryInfo(types: string[]): Category {
  for (const type of types) {
    if (CATEGORY_MAP[type]) return CATEGORY_MAP[type]
  }
  return DEFAULT_CATEGORY
}

// DB place_categories.name (한국어) 기반 조회
const KO_LABEL_MAP: Record<string, string> = {
  식당: 'restaurant',
  테이크아웃: 'meal_takeaway',
  배달: 'meal_delivery',
  베이커리: 'bakery',
  카페: 'cafe',
  숙소: 'lodging',
  호텔: 'hotel',
  모텔: 'motel',
  관광지: 'tourist_attraction',
  박물관: 'museum',
  갤러리: 'art_gallery',
  테마파크: 'amusement_park',
  액티비티: 'amusement_park',
  쇼핑: 'shopping_mall',
  쇼핑몰: 'shopping_mall',
  상점: 'store',
  의류: 'clothing_store',
  백화점: 'department_store',
  공원: 'park',
  자연: 'natural_feature',
  캠핑: 'campground',
  나이트: 'night_club',
  바: 'bar',
  지하철: 'subway_station',
  기차역: 'train_station',
  버스: 'bus_station',
  공항: 'airport',
  병원: 'hospital',
  약국: 'pharmacy',
}

export function getCategoryInfoByLabel(label: string): Category {
  if (CATEGORY_MAP[label]) return CATEGORY_MAP[label]
  const googleType = KO_LABEL_MAP[label]
  return googleType ? (CATEGORY_MAP[googleType] ?? DEFAULT_CATEGORY) : DEFAULT_CATEGORY
}

// Google Places API types → DB place_categories.name 변환
const GOOGLE_TYPE_TO_DB: Record<string, string> = {
  restaurant: '식당',
  food: '식당',
  meal_takeaway: '식당',
  meal_delivery: '식당',
  fast_food_restaurant: '식당',
  korean_restaurant: '식당',
  chinese_restaurant: '식당',
  japanese_restaurant: '식당',
  american_restaurant: '식당',
  seafood_restaurant: '식당',
  cafe: '카페',
  bakery: '카페',
  coffee: '카페',
  coffee_shop: '카페',
  tourist_attraction: '관광지',
  museum: '관광지',
  art_gallery: '관광지',
  point_of_interest: '관광지',
  landmark: '관광지',
  historical_place: '관광지',
  cultural_landmark: '관광지',
  monument: '관광지',
  palace: '관광지',
  castle: '관광지',
  shrine: '관광지',
  temple: '관광지',
  church: '관광지',
  zoo: '관광지',
  aquarium: '관광지',
  lodging: '숙소',
  hotel: '숙소',
  motel: '숙소',
  shopping_mall: '쇼핑',
  store: '쇼핑',
  clothing_store: '쇼핑',
  department_store: '쇼핑',
  convenience_store: '쇼핑',
  supermarket: '쇼핑',
  grocery_store: '쇼핑',
  park: '자연',
  natural_feature: '자연',
  campground: '자연',
  national_park: '자연',
  beach: '자연',
  forest: '자연',
  amusement_park: '액티비티',
  sports_complex: '액티비티',
  stadium: '액티비티',
  golf_course: '액티비티',
  bowling_alley: '액티비티',
}

export function getDbCategory(types: string[]): string {
  for (const type of types) {
    if (GOOGLE_TYPE_TO_DB[type]) return GOOGLE_TYPE_TO_DB[type]
  }
  return '기타'
}

// 지도 마커 색상 (hex)
export function getMarkerColor(types: string[]): string {
  const colorMap: Record<string, string> = {
    restaurant: '#E85D04',
    food: '#E85D04',
    meal_takeaway: '#E85D04',
    cafe: '#92400E',
    bakery: '#92400E',
    coffee: '#92400E',
    lodging: '#1B6FF0',
    hotel: '#1B6FF0',
    tourist_attraction: '#D97706',
    museum: '#D97706',
    amusement_park: '#D97706',
    shopping_mall: '#7C3AED',
    store: '#7C3AED',
    park: '#059669',
    natural_feature: '#059669',
    night_club: '#DB2777',
    bar: '#DB2777',
    subway_station: '#0891B2',
    airport: '#0891B2',
    hospital: '#DC2626',
  }
  for (const type of types) {
    if (colorMap[type]) return colorMap[type]
  }
  return '#1B6FF0'
}
