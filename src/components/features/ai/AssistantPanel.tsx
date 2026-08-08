'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isTextUIPart } from 'ai'
import { useLocale } from 'next-intl'
import { useAssistantStore } from '@/lib/ai/store'
import CharacterAvatar from './CharacterAvatar'
import MarkdownContent from '@/components/ui/MarkdownContent'
import type { CharacterId } from '@/lib/ai/characters'

const CHARACTER_INFO: Record<CharacterId, { name: string; greeting: string; greetingEn: string }> = {
  kakali: {
    name: '까칠이',
    greeting: '...뭐야. 여행 계획 도와줄게.\n뭐가 궁금해?',
    greetingEn: "...What. I'll help you plan. What do you need?",
  },
  dajeong: {
    name: '다정이',
    greeting: '안녕하세요! 어떤 여행을 꿈꾸고\n계신가요? 함께 계획해봐요 ✈️',
    greetingEn: "Hello! What kind of trip are you dreaming of?\nLet's plan it together ✈️",
  },
}

const SUGGESTIONS_KO = ['주말 국내 여행지 추천', '제주도 3박4일 일정', '혼자 여행하기 좋은 곳']
const SUGGESTIONS_EN = ['Weekend trip ideas', '3-night Jeju itinerary', 'Best solo travel spots']

export default function AssistantPanel() {
  const { isOpen, close, character, setCharacter, initialPrompt, clearInitialPrompt } = useAssistantStore()
  const locale = useLocale() as 'ko' | 'en'
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const prevCharacterRef = useRef<CharacterId>(character)
  const characterRef = useRef(character)
  const localeRef = useRef(locale)

  useEffect(() => { characterRef.current = character }, [character])
  useEffect(() => { localeRef.current = locale }, [locale])

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/ai/assistant',
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages,
            character: characterRef.current,
            locale: localeRef.current,
          },
        }),
      }),
    [],
  )

  const { messages, sendMessage, status, setMessages } = useChat({ transport })

  useEffect(() => {
    if (prevCharacterRef.current !== character) {
      setMessages([])
      setInputText('')
      prevCharacterRef.current = character
    }
  }, [character, setMessages])

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Auto-send initialPrompt when panel opens
  useEffect(() => {
    if (isOpen && initialPrompt) {
      const t = setTimeout(() => {
        sendMessage({ text: initialPrompt })
        clearInitialPrompt()
      }, 150)
      return () => clearTimeout(t)
    }
  }, [isOpen, initialPrompt, sendMessage, clearInitialPrompt])

  useEffect(() => {
    if (isOpen && !initialPrompt) {
      const t = setTimeout(() => inputRef.current?.focus(), 320)
      return () => clearTimeout(t)
    }
  }, [isOpen, initialPrompt])

  const isLoading = status === 'submitted' || status === 'streaming'
  const hasMessages = messages.length > 0
  const lastIsUser = messages.at(-1)?.role === 'user'

  function handleSend() {
    const text = inputText.trim()
    if (!text || isLoading) return
    setInputText('')
    sendMessage({ text })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const info = CHARACTER_INFO[character]
  const greeting = locale === 'ko' ? info.greeting : info.greetingEn
  const suggestions = locale === 'ko' ? SUGGESTIONS_KO : SUGGESTIONS_EN

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col bg-white transition-transform duration-300 ease-out ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={close}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-bg2"
          aria-label="닫기"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="var(--color-ink2)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Character toggle */}
        <div className="flex items-center gap-0.5 rounded-full bg-bg2 p-1">
          {(['dajeong', 'kakali'] as CharacterId[]).map((c) => (
            <button
              key={c}
              onClick={() => setCharacter(c)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-all ${
                character === c ? 'bg-white text-ink shadow-sm' : 'text-ink3'
              }`}
            >
              <CharacterAvatar character={c} size="xs" />
              {CHARACTER_INFO[c].name}
            </button>
          ))}
        </div>

        <div className="w-9" />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          /* Welcome state */
          <div className="flex flex-col items-center px-6 pt-12 pb-6">
            <CharacterAvatar character={character} size="xl" />
            <p className="mt-4 text-[20px] font-bold text-ink">{info.name}</p>
            <p className="mt-2 text-center text-[14px] leading-relaxed text-ink2 whitespace-pre-line">
              {greeting}
            </p>

            <div className="mt-8 w-full space-y-2.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInputText(''); sendMessage({ text: s }) }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3.5 text-left transition-colors hover:bg-bg2"
                >
                  <span className="text-[16px]">✈️</span>
                  <span className="text-[14px] text-ink2">{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat messages */
          <div className="space-y-3 px-4 py-4">
            {messages.map((message) => {
              const text = message.parts
                .filter(isTextUIPart)
                .map((p) => p.text)
                .join('')

              if (message.role === 'user') {
                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[78%] rounded-[18px] rounded-br-[4px] bg-primary px-4 py-3 text-[14px] leading-relaxed text-white">
                      {text}
                    </div>
                  </div>
                )
              }

              return (
                <div key={message.id} className="flex items-start gap-2">
                  <CharacterAvatar character={character} size="sm" />
                  <div className="max-w-[78%] rounded-[18px] rounded-bl-[4px] bg-bg2 px-4 py-3">
                    {text ? <MarkdownContent text={text} /> : <TypingDots />}
                  </div>
                </div>
              )
            })}

            {isLoading && lastIsUser && (
              <div className="flex items-start gap-2">
                <CharacterAvatar character={character} size="sm" />
                <div className="rounded-[18px] rounded-bl-[4px] bg-bg2 px-4 py-3">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div
        className="flex-shrink-0 border-t border-border bg-white px-4 pt-3"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={locale === 'ko' ? '무엇이든 물어보세요...' : 'Ask me anything...'}
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-border bg-bg2 px-4 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink3 focus:border-primary"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary transition-opacity disabled:opacity-40"
            aria-label="전송"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 14V4M9 4L5 8M9 4l4 4"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1" style={{ height: '20px' }}>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 rounded-full bg-ink3 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}
