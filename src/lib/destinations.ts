import type { Locale } from './ai/characters'

/**
 * 여행지 카탈로그 — 홈 '추천 여행지'와 목적지 선택 시트가 함께 쓴다.
 *
 * photoId는 Unsplash CDN의 사진 식별자다(`images.unsplash.com/photo-<id>`).
 * 여기 없는 목적지는 Google Places API에서 사진을 찾고, 그마저 없으면
 * gradient 자리에 대체 그라디언트를 깔아 카드가 비지 않게 한다.
 */
export interface Destination {
  ko: string
  en: string
  regionKo: string
  regionEn: string
  photoId: string
  gradient: string
}

export const DESTINATIONS: Destination[] = [
  {
    ko: '서울',
    en: 'Seoul',
    regionKo: '대한민국',
    regionEn: 'Korea',
    photoId: '1570191913384-7b4ff11716e7',
    gradient: 'linear-gradient(145deg,#1a1a2e,#16213e)',
  },
  {
    ko: '제주도',
    en: 'Jeju',
    regionKo: '대한민국',
    regionEn: 'Korea',
    photoId: '1612977512598-3b8d6a498bbb',
    gradient: 'linear-gradient(145deg,#0096c7,#00b4d8)',
  },
  {
    ko: '도쿄',
    en: 'Tokyo',
    regionKo: '일본',
    regionEn: 'Japan',
    photoId: '1540959733332-eab4deabeeaf',
    gradient: 'linear-gradient(145deg,#2d3561,#c05c7e)',
  },
  {
    ko: '방콕',
    en: 'Bangkok',
    regionKo: '태국',
    regionEn: 'Thailand',
    photoId: '1563492065599-3520f775eeed',
    gradient: 'linear-gradient(145deg,#c0392b,#e67e22)',
  },
  {
    ko: '파리',
    en: 'Paris',
    regionKo: '프랑스',
    regionEn: 'France',
    photoId: '1499856871958-5b9627545d1a',
    gradient: 'linear-gradient(145deg,#2c3e7a,#8e44ad)',
  },
  {
    ko: '발리',
    en: 'Bali',
    regionKo: '인도네시아',
    regionEn: 'Indonesia',
    photoId: '1555400038-63f5ba517a47',
    gradient: 'linear-gradient(145deg,#2d6a4f,#95d5b2)',
  },
  {
    ko: '뉴욕',
    en: 'New York',
    regionKo: '미국',
    regionEn: 'USA',
    photoId: '1496588152823-86ff7695e68f',
    gradient: 'linear-gradient(145deg,#1c2841,#4a90d9)',
  },
  {
    ko: '오사카',
    en: 'Osaka',
    regionKo: '일본',
    regionEn: 'Japan',
    photoId: '1589452271712-64b8a66c7b71',
    gradient: 'linear-gradient(145deg,#c0392b,#f39c12)',
  },
  {
    ko: '싱가포르',
    en: 'Singapore',
    regionKo: '싱가포르',
    regionEn: 'Singapore',
    photoId: '1508964942454-1a56651d54ac',
    gradient: 'linear-gradient(145deg,#0f3460,#e94560)',
  },
  {
    ko: '홍콩',
    en: 'Hong Kong',
    regionKo: '중국',
    regionEn: 'China',
    photoId: '1678110721308-a08ed05a7938',
    gradient: 'linear-gradient(145deg,#fc5c7d,#6a3093)',
  },
  {
    ko: '다낭',
    en: 'Da Nang',
    regionKo: '베트남',
    regionEn: 'Vietnam',
    photoId: '1559592413-7cec4d0cae2b',
    gradient: 'linear-gradient(145deg,#0052D4,#4364F7)',
  },
  {
    ko: '하와이',
    en: 'Hawaii',
    regionKo: '미국',
    regionEn: 'USA',
    photoId: '1505852679233-d9fd70aff56d',
    gradient: 'linear-gradient(145deg,#1a6b77,#f7c59f)',
  },
  {
    ko: '후쿠오카',
    en: 'Fukuoka',
    regionKo: '일본',
    regionEn: 'Japan',
    photoId: '1622522070156-2de99ac90cdf',
    gradient: 'linear-gradient(145deg,#f7971e,#ffd200)',
  },
  {
    ko: '런던',
    en: 'London',
    regionKo: '영국',
    regionEn: 'UK',
    photoId: '1486299267070-83823f5448dd',
    gradient: 'linear-gradient(145deg,#373b44,#4286f4)',
  },
  {
    ko: '로마',
    en: 'Rome',
    regionKo: '이탈리아',
    regionEn: 'Italy',
    photoId: '1552832230-c0197dd311b5',
    gradient: 'linear-gradient(145deg,#9d4e15,#f5af19)',
  },
  {
    ko: '바르셀로나',
    en: 'Barcelona',
    regionKo: '스페인',
    regionEn: 'Spain',
    photoId: '1583422409516-2895a77efded',
    gradient: 'linear-gradient(145deg,#d31027,#ea384d)',
  },
  {
    ko: '나트랑',
    en: 'Nha Trang',
    regionKo: '베트남',
    regionEn: 'Vietnam',
    photoId: '1654930453993-bf69bbb3a00d',
    gradient: 'linear-gradient(145deg,#1b6ca8,#145DA0)',
  },
  {
    ko: '나폴리',
    en: 'Naples',
    regionKo: '이탈리아',
    regionEn: 'Italy',
    photoId: '1552832230-c0197dd311b5',
    gradient: 'linear-gradient(145deg,#f7971e,#ffd200)',
  },
  {
    ko: '프라하',
    en: 'Prague',
    regionKo: '체코',
    regionEn: 'Czechia',
    photoId: '1600623471616-8c1966c91ff6',
    gradient: 'linear-gradient(145deg,#614385,#516395)',
  },
  {
    ko: '교토',
    en: 'Kyoto',
    regionKo: '일본',
    regionEn: 'Japan',
    photoId: '1545569341-9eb8b30979d9',
    gradient: 'linear-gradient(145deg,#c94b4b,#4b134f)',
  },
  {
    ko: '삿포로',
    en: 'Sapporo',
    regionKo: '일본',
    regionEn: 'Japan',
    photoId: '1572420780547-8fbb45c82f0a',
    gradient: 'linear-gradient(145deg,#2c3e50,#4ca1af)',
  },
  {
    ko: '푸켓',
    en: 'Phuket',
    regionKo: '태국',
    regionEn: 'Thailand',
    photoId: '1552465011-b4e21bf6e79a',
    gradient: 'linear-gradient(145deg,#0082c8,#667db6)',
  },
  {
    ko: '치앙마이',
    en: 'Chiang Mai',
    regionKo: '태국',
    regionEn: 'Thailand',
    photoId: '1512553353614-82a7370096dc',
    gradient: 'linear-gradient(145deg,#c94b4b,#4b134f)',
  },
  {
    ko: '이스탄불',
    en: 'Istanbul',
    regionKo: '터키',
    regionEn: 'Turkey',
    photoId: '1527838832700-5059252407fa',
    gradient: 'linear-gradient(145deg,#c94b4b,#e55d87)',
  },
  {
    ko: '두바이',
    en: 'Dubai',
    regionKo: '아랍에미리트',
    regionEn: 'UAE',
    photoId: '1512453979798-5ea266f8880c',
    gradient: 'linear-gradient(145deg,#c79081,#dfa579)',
  },
  {
    ko: '암스테르담',
    en: 'Amsterdam',
    regionKo: '네덜란드',
    regionEn: 'Netherlands',
    photoId: '1534351590666-13e3e96b5017',
    gradient: 'linear-gradient(145deg,#1a6b77,#34e89e)',
  },
]

/** 목적지 이름으로 빠르게 찾기 위한 색인 */
const BY_NAME = new Map(DESTINATIONS.map((d) => [d.ko, d]))

/**
 * 사용자가 입력한 이름으로 카탈로그를 찾는다.
 * '제주시'처럼 표기가 조금 달라도 앞 두 글자가 겹치면 같은 곳으로 본다.
 */
export function findDestination(name: string): Destination | undefined {
  const exact = BY_NAME.get(name)
  if (exact) return exact
  const head = name.slice(0, 2)
  return DESTINATIONS.find((d) => d.ko.startsWith(head) || name.startsWith(d.ko.slice(0, 2)))
}

export function destinationName(d: Destination, locale: Locale): string {
  return locale === 'ko' ? d.ko : d.en
}

export function destinationRegion(d: Destination, locale: Locale): string {
  return locale === 'ko' ? d.regionKo : d.regionEn
}

/** Unsplash CDN 썸네일 URL */
export function destinationPhotoUrl(photoId: string, size: number): string {
  return `https://images.unsplash.com/photo-${photoId}?w=${size}&h=${size}&fit=crop&q=75`
}

/** 카탈로그에 사진이 없을 때 카드 배경으로 쓰는 그라디언트 */
export const FALLBACK_GRADIENTS = [
  'linear-gradient(145deg,#667eea,#764ba2)',
  'linear-gradient(145deg,#f093fb,#f5576c)',
  'linear-gradient(145deg,#4facfe,#00f2fe)',
  'linear-gradient(145deg,#43e97b,#38f9d7)',
  'linear-gradient(145deg,#fa709a,#fee140)',
  'linear-gradient(145deg,#a18cd1,#fbc2eb)',
]
