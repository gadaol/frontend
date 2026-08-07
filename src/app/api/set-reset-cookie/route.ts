import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('pwd_reset_pending', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 900,
  })
  return res
}
