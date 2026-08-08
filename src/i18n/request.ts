import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as 'ko' | 'en')) {
    locale = routing.defaultLocale
  }

  const namespaces = [
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
  ]
  const messages = Object.fromEntries(
    await Promise.all(
      namespaces.map(async (ns) => [
        ns,
        (await import(`../../locale/${locale}/${ns}.json`)).default,
      ]),
    ),
  )

  return { locale, messages }
})
