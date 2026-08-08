import type { UIMessage } from 'ai'
import type { CharacterId } from './characters'

/**
 * 지난 대화 보관소.
 *
 * 서버에 저장하지 않고 브라우저에만 둔다 — 대화에는 아직 정리되지 않은
 * 개인 일정·취향이 섞여 있고, 기기를 옮겨 이어 볼 요구는 아직 없다.
 * 서버 저장이 필요해지면 이 모듈의 인터페이스만 유지한 채 교체하면 된다.
 */
export interface Conversation {
  id: string
  character: CharacterId
  title: string
  messages: UIMessage[]
  updatedAt: number
}

const KEY = 'gadarog-ai-history'
/** 오래된 대화까지 무한정 쌓이면 localStorage 용량을 넘긴다 */
const MAX = 30

function canUseStorage() {
  return typeof window !== 'undefined' && !!window.localStorage
}

export function loadConversations(): Conversation[] {
  if (!canUseStorage()) return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Conversation[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(list: Conversation[]) {
  if (!canUseStorage()) return
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
  } catch {
    /* 용량 초과 등은 조용히 넘긴다 — 기록은 부가 기능이다 */
  }
}

/** 첫 사용자 발화를 제목으로 삼는다 */
export function deriveTitle(messages: UIMessage[]): string {
  const first = messages.find((m) => m.role === 'user')
  if (!first) return ''
  const text = first.parts
    .map((p) => (p.type === 'text' ? p.text : ''))
    .join('')
    .trim()
  return text.length > 40 ? text.slice(0, 40) + '…' : text
}

/** 같은 id가 있으면 갱신하고, 없으면 맨 앞에 넣는다 */
export function saveConversation(conv: Conversation): Conversation[] {
  const list = loadConversations().filter((c) => c.id !== conv.id)
  const next = [conv, ...list]
  persist(next)
  return next
}

export function deleteConversation(id: string): Conversation[] {
  const next = loadConversations().filter((c) => c.id !== id)
  persist(next)
  return next
}

export function clearConversations() {
  if (!canUseStorage()) return
  localStorage.removeItem(KEY)
}

/** 목록에 보여줄 상대 시각 */
export function relativeTime(ts: number, locale: 'ko' | 'en'): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  const hour = Math.floor(min / 60)
  const day = Math.floor(hour / 24)

  if (locale === 'ko') {
    if (min < 1) return '방금'
    if (min < 60) return `${min}분 전`
    if (hour < 24) return `${hour}시간 전`
    if (day < 7) return `${day}일 전`
    return new Date(ts).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  }
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  if (hour < 24) return `${hour}h ago`
  if (day < 7) return `${day}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
