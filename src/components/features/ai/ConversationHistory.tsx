'use client'

import CharacterAvatar from './CharacterAvatar'
import { relativeTime, type Conversation } from '@/lib/ai/history'
import { CHARACTER_META, type Locale } from '@/lib/ai/characters'

interface Props {
  conversations: Conversation[]
  locale: Locale
  onOpen: (conv: Conversation) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export default function ConversationHistory({
  conversations,
  locale,
  onOpen,
  onDelete,
  onClose,
}: Props) {
  const isKo = locale === 'ko'

  return (
    <>
      <div className="fixed inset-0 z-[110] bg-black/40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[111] flex max-h-[78dvh] flex-col rounded-t-3xl bg-white">
        <div className="flex flex-shrink-0 justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        <div className="flex flex-shrink-0 items-center justify-between px-5 pb-3">
          <p className="text-ink text-[17px] font-bold">{isKo ? '지난 대화' : 'Past chats'}</p>
          <button onClick={onClose} className="text-ink3 text-[13px] font-medium active:opacity-60">
            {isKo ? '닫기' : 'Close'}
          </button>
        </div>

        <div className="bg-border h-px flex-shrink-0" />

        {conversations.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14">
            <p className="text-ink2 text-[14px] font-medium">
              {isKo ? '아직 저장된 대화가 없어요' : 'No saved chats yet'}
            </p>
            <p className="text-ink3 mt-1 text-center text-[12px] leading-relaxed">
              {isKo
                ? '대화를 나누면 여기에 자동으로 쌓여요'
                : 'Your conversations will show up here'}
            </p>
          </div>
        ) : (
          <div
            className="flex-1 overflow-y-auto px-3 py-2"
            style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
          >
            {conversations.map((c) => (
              <div
                key={c.id}
                className="group active:bg-bg2 flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors"
              >
                <button
                  onClick={() => onOpen(c)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <CharacterAvatar character={c.character} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="text-ink block truncate text-[14px] font-medium">
                      {c.title || (isKo ? '제목 없는 대화' : 'Untitled')}
                    </span>
                    <span className="text-ink3 mt-0.5 block text-[11px]">
                      {CHARACTER_META[c.character].name[locale]} ·{' '}
                      {relativeTime(c.updatedAt, locale)}
                    </span>
                  </span>
                </button>

                <button
                  onClick={() => onDelete(c.id)}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full active:opacity-60"
                  aria-label={isKo ? '삭제' : 'Delete'}
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path
                      d="M3 4h9M6 4V2.8h3V4M4.2 4l.5 8.2h5.6L10.8 4"
                      stroke="var(--color-ink3)"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
