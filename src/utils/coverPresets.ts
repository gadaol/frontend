/** 여행 커버 색상 프리셋 — 그라디언트 없이 디자인 시스템 대표 색상만 단색으로 사용.
 *  너무 어둡거나 무채색으로 보이는 톤은 제외하고, 밝은 변형은 color-mix로 같은 토큰에서만 파생.
 *  업로드 버튼(1개) + 프리셋(9개) = 10개로, 5열 그리드에서 정확히 2줄로 채워짐. */
export const COVER_PRESETS = [
  'var(--color-primary)',
  'var(--color-primary-hover)',
  'var(--color-accent)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-error)',
  'color-mix(in srgb, var(--color-primary) 55%, white)',
  'color-mix(in srgb, var(--color-accent) 55%, white)',
  'color-mix(in srgb, var(--color-warning) 55%, white)',
]
