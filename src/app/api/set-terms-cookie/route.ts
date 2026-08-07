import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('terms_pending', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10분
  })
  return res
}
