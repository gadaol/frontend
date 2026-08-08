import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

const NAMESPACES = [
  'common',
  'auth',
  'onboarding',
  'home',
  'trips',
  'places',
  'mypage',
  'backlog',
  'notifications',
  'inquiries',
  'notices',
  'ai',
] as const

/**
 * 네임스페이스 하나를 읽는다.
 *
 * Promise.all로 한 번에 묶으면 파일 하나가 없을 때 messages 전체가 날아가서
 * 무관한 화면까지 통째로 번역이 깨진다(네임스페이스를 새로 추가한 직후 dev
 * 서버가 이 상태가 된다). 그래서 실패를 네임스페이스 단위로 가둔다.
 */
async function loadNamespace(locale: string, ns: string): Promise<[string, object]> {
  try {
    return [ns, (await import(`../../locale/${locale}/${ns}.json`)).default]
  } catch {
    console.error(
      `[i18n] '${locale}/${ns}.json'을 읽지 못했습니다. ` +
        `파일을 방금 추가했다면 dev 서버를 재시작하세요.`,
    )
    return [ns, {}]
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as 'ko' | 'en')) {
    locale = routing.defaultLocale
  }

  const messages = Object.fromEntries(
    await Promise.all(NAMESPACES.map((ns) => loadNamespace(locale, ns))),
  )

  return { locale, messages }
})
