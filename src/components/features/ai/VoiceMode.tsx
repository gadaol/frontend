'use client'

import { useEffect, useRef } from 'react'
import VoiceOrb, { type VoiceState } from './VoiceOrb'
import { CHARACTER_META, type CharacterId, type Locale } from '@/lib/ai/characters'

export interface VoiceNote {
  id: string
  title: string | null
  points: string[]
}

interface Props {
  character: CharacterId
  locale: Locale
  state: VoiceState
  /** 사용자가 지금 말하고 있는 내용 (실시간) */
  interim: string
  /** 캐릭터가 방금 말한 내용 */
  spoken: string
  notes: VoiceNote[]
  error: string | null
  onToggleMic: () => void
  onExit: () => void
}

const LABEL: Record<VoiceState, Record<Locale, string>> = {
  idle: { ko: '마이크를 눌러 말해보세요', en: 'Tap the mic to talk' },
  listening: { ko: '듣고 있어요', en: 'Listening' },
  thinking: { ko: '생각 중', en: 'Thinking' },
  speaking: { ko: '말하는 중', en: 'Speaking' },
}

export default function VoiceMode({
  character,
  locale,
  state,
  interim,
  spoken,
  notes,
  error,
  onToggleMic,
  onExit,
}: Props) {
  const notesEndRef = useRef<HTMLDivElement>(null)
  const meta = CHARACTER_META[character]

  useEffect(() => {
    notesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [notes])

  // 말하는 중엔 캐릭터 말이, 그 외엔 내 말이 자막에 뜬다
  const caption = state === 'speaking' || state === 'thinking' ? spoken : interim

  return (
    <div className="flex h-full flex-col bg-white">
      {/* 상단 — 나가기 */}
      <div className="flex flex-shrink-0 items-center justify-between px-4 py-3">
        <button
          onClick={onExit}
          className="bg-bg2 text-ink2 flex items-center gap-1.5 rounded-full py-2 pr-3.5 pl-2.5 text-[13px] font-medium active:opacity-70"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M8.5 3.5L5 7l3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {locale === 'ko' ? '채팅으로' : 'Back to chat'}
        </button>
        <p className="text-ink2 text-[13px] font-semibold">{meta.name[locale]}</p>
        <div className="w-[92px]" />
      </div>

      {/* 오브 + 자막 */}
      <div className="flex flex-shrink-0 flex-col items-center px-8 pt-4 pb-2">
        <VoiceOrb character={character} state={state} />

        <p className="text-ink3 mt-5 text-[12px] font-medium tracking-wide">
          {error
            ? locale === 'ko'
              ? '마이크를 사용할 수 없어요'
              : 'Microphone unavailable'
            : LABEL[state][locale]}
        </p>

        <div className="mt-2 flex min-h-[56px] w-full items-start justify-center">
          {caption && (
            <p
              key={caption.slice(-24)}
              className={`caption-rise text-center text-[17px] leading-relaxed ${
                state === 'listening' ? 'text-ink' : 'text-ink2 font-medium'
              }`}
            >
              {caption}
            </p>
          )}
        </div>
      </div>

      {/* 정리 노트 — 대화는 흘러가고 여기에 결론만 쌓인다 */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {notes.length > 0 && (
          <>
            <div className="sticky top-0 flex items-center gap-2 bg-white/90 py-2 backdrop-blur-sm">
              <p className="text-ink3 text-[11px] font-semibold tracking-wide">
                {locale === 'ko' ? '정리한 내용' : 'NOTES'}
              </p>
              <div className="bg-border h-px flex-1" />
            </div>
            <div className="space-y-2 pb-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="ai-fade border-border bg-bg2 rounded-2xl border px-3.5 py-3"
                >
                  {note.title && <p className="text-ink text-[13px] font-bold">{note.title}</p>}
                  {note.points.length > 0 && (
                    <ul className="mt-1.5 space-y-1">
                      {note.points.map((p, i) => (
                        <li key={i} className="text-ink2 flex gap-2 text-[13px] leading-snug">
                          <span
                            className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full"
                            style={{ background: meta.color }}
                          />
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              <div ref={notesEndRef} />
            </div>
          </>
        )}
      </div>

      {/* 마이크 */}
      <div
        className="flex flex-shrink-0 flex-col items-center pt-3"
        style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={onToggleMic}
          className="flex h-[68px] w-[68px] items-center justify-center rounded-full transition-transform active:scale-95"
          style={{
            background: state === 'listening' ? meta.color : 'var(--color-bg2)',
            boxShadow: state === 'listening' ? `0 6px 24px ${meta.color}55` : 'none',
          }}
          aria-label={state === 'listening' ? '마이크 끄기' : '마이크 켜기'}
        >
          {state === 'listening' ? (
            <span className="h-5 w-5 rounded-[5px] bg-white" />
          ) : (
            <MicIcon />
          )}
        </button>
      </div>
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect
        x="9.5"
        y="3"
        width="7"
        height="12"
        rx="3.5"
        stroke="var(--color-ink2)"
        strokeWidth="1.7"
      />
      <path
        d="M6 12a7 7 0 0 0 14 0M13 19v3.5"
        stroke="var(--color-ink2)"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}
