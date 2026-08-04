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
  bakery: { icon: CafeIcon, color: 'text-[#92400E]', bg: 'bg-[#FEF3C7]', label: '베이커리' },
  cafe: { icon: CafeIcon, color: 'text-[#92400E]', bg: 'bg-[#FEF3C7]', label: '카페' },
  coffee: { icon: CafeIcon, color: 'text-[#92400E]', bg: 'bg-[#FEF3C7]', label: '카페' },
  lodging: { icon: HotelIcon, color: 'text-[#1B6FF0]', bg: 'bg-[#EBF1FE]', label: '숙소' },
  hotel: { icon: HotelIcon, color: 'text-[#1B6FF0]', bg: 'bg-[#EBF1FE]', label: '호텔' },
  motel: { icon: HotelIcon, color: 'text-[#1B6FF0]', bg: 'bg-[#EBF1FE]', label: '모텔' },
  tourist_attraction: {
    icon: AttractionIcon,
    color: 'text-[#D97706]',
    bg: 'bg-[#FEF3C7]',
    label: '관광지',
  },
  museum: { icon: AttractionIcon, color: 'text-[#D97706]', bg: 'bg-[#FEF3C7]', label: '박물관' },
  art_gallery: {
    icon: AttractionIcon,
    color: 'text-[#D97706]',
    bg: 'bg-[#FEF3C7]',
    label: '갤러리',
  },
  amusement_park: {
    icon: AttractionIcon,
    color: 'text-[#D97706]',
    bg: 'bg-[#FEF3C7]',
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
  park: { icon: ParkIcon, color: 'text-[#059669]', bg: 'bg-[#D1FAE5]', label: '공원' },
  natural_feature: { icon: ParkIcon, color: 'text-[#059669]', bg: 'bg-[#D1FAE5]', label: '자연' },
  campground: { icon: ParkIcon, color: 'text-[#059669]', bg: 'bg-[#D1FAE5]', label: '캠핑' },
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
  color: 'text-[#1B6FF0]',
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
  카페: 'cafe',
  숙소: 'lodging',
  관광지: 'tourist_attraction',
  쇼핑: 'shopping_mall',
  자연: 'park',
  액티비티: 'amusement_park',
}

export function getCategoryInfoByLabel(label: string): Category {
  const googleType = KO_LABEL_MAP[label]
  return googleType ? (CATEGORY_MAP[googleType] ?? DEFAULT_CATEGORY) : DEFAULT_CATEGORY
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
