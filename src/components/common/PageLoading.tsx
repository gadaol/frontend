/**
 * 라우트 단위 로딩 화면.
 *
 * 데이터를 받아오는 동안 화면 전체가 비어 보이지 않도록 각 라우트의
 * loading.tsx가 이걸 그대로 렌더한다. 부분 스피너로 부족한 자리에 쓴다.
 */
export default function PageLoading() {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <div className="border-primary h-7 w-7 animate-spin rounded-full border-2 border-t-transparent" />
    </div>
  )
}
