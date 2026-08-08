import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getInviteInfo } from '@/app/actions/invite'
import JoinClient from './_components/JoinClient'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function JoinPage({ searchParams }: Props) {
  const { token } = await searchParams
  const locale = await getLocale()

  if (!token) redirect(`/${locale}/home`)

  const invite = await getInviteInfo(token)

  if (!invite) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-4xl">😢</div>
        <h1 className="text-ink text-[20px] font-bold">초대 링크가 만료됐어요</h1>
        <p className="text-ink3 text-[14px]">오너에게 새 링크를 요청해주세요</p>
      </div>
    )
  }

  const trip = invite.trips
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const joinPath = `/${locale}/trips/${trip.id}/join?token=${token}`

  // 비로그인 → 로그인 페이지로 (redirectTo 포함)
  if (!user) {
    return (
      <div className="flex min-h-dvh flex-col">
        {/* 커버 */}
        <div
          className="h-52 flex-shrink-0"
          style={{
            background:
              trip.cover_url ??
              'linear-gradient(135deg, var(--color-hero-top), var(--color-primary))',
          }}
        />
        <div className="flex flex-1 flex-col px-6 pt-6 pb-10">
          <p className="text-primary mb-1 text-[13px] font-medium">여행 초대</p>
          <h1 className="text-ink mb-1 text-[22px] font-bold">{trip.title}</h1>
          {trip.destination && <p className="text-ink3 mb-4 text-[14px]">📍 {trip.destination}</p>}
          <p className="text-ink3 mb-8 text-[14px]">
            이 여행에 참여하려면 가다로그 회원이어야 해요.
          </p>
          <a
            href={`/${locale}?redirectTo=${encodeURIComponent(joinPath)}`}
            className="bg-primary block w-full rounded-2xl py-4 text-center text-[16px] font-bold text-white"
          >
            로그인 / 회원가입 후 참여
          </a>
        </div>
      </div>
    )
  }

  // 이미 멤버인지 확인
  const { data: existing } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', trip.id)
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="flex min-h-dvh flex-col">
      {/* 커버 */}
      <div
        className="h-52 flex-shrink-0"
        style={{
          background:
            trip.cover_url ??
            'linear-gradient(135deg, var(--color-hero-top), var(--color-primary))',
        }}
      />
      <div className="flex flex-1 flex-col px-6 pt-6 pb-10">
        <p className="text-primary mb-1 text-[13px] font-medium">여행 초대</p>
        <h1 className="text-ink mb-1 text-[22px] font-bold">{trip.title}</h1>
        {trip.destination && <p className="text-ink3 mb-1 text-[14px]">📍 {trip.destination}</p>}
        {trip.start_date && (
          <p className="text-ink3 mb-6 text-[14px]">
            {trip.start_date} ~ {trip.end_date ?? '미정'}
          </p>
        )}
        <div className="mt-auto">
          <JoinClient token={token} alreadyMember={!!existing} />
        </div>
      </div>
    </div>
  )
}
