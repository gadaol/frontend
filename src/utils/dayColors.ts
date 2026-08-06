/**
 * 여행 일자별 구분 색상. 고정 팔레트를 순환시키면 날짜 수가 팔레트보다 많을 때
 * 색상이 겹쳐 구분이 안 되므로, 전체 일수에 맞춰 색상환을 균등 분할해 매번 유니크한 색을 만든다.
 * 채도는 형광처럼 튀지 않도록 낮춰 차분한 톤을 유지한다.
 */
export function getDayColor(dayNumber: number, totalDays: number): string {
  const n = Math.max(totalDays, 1)
  const hue = (216 + ((dayNumber - 1) * 360) / n) % 360
  return `hsl(${hue}deg 55% 46%)`
}
