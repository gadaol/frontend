'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isTextUIPart, type UIMessage } from 'ai'
import { useLocale, useTranslations } from 'next-intl'
import { useAssistantStore } from '@/lib/ai/store'
import { useVoice } from '@/hooks/useVoice'
import CharacterAvatar from './CharacterAvatar'
import CharacterFigure from './CharacterFigure'
import VoiceMode, { type VoiceNote } from './VoiceMode'
import type { VoiceState } from './VoiceOrb'
import ConversationHistory from './ConversationHistory'
import MarkdownContent from '@/components/ui/MarkdownContent'
import { CHARACTER_META, type CharacterId } from '@/lib/ai/characters'
import {
  loadConversations,
  saveConversation,
  deleteConversation,
  deriveTitle,
  type Conversation,
} from '@/lib/ai/history'

/** 눈썹 문구가 있어야 셋이 나란히 있을 때 성격이 구분된다 */
const SUGGESTION_KEYS = ['nearby', 'plan', 'solo'] as const

export default function AssistantPanel() {
  const { isOpen, close, character, setCharacter, initialPrompt, clearInitialPrompt } =
    useAssistantStore()
  const locale = useLocale() as 'ko' | 'en'
  const t = useTranslations('ai')

  const [inputText, setInputText] = useState('')
  const [voiceMode, setVoiceMode] = useState(false)
  const [notes, setNotes] = useState<VoiceNote[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // nativeEvent.isComposing만으로는 Safari에서 IME 조합 종료 타이밍이
  // 어긋나는 경우가 있어 compositionstart/end로도 직접 추적해 이중으로 막는다.
  const isComposingRef = useRef(false)
  const prevCharacterRef = useRef<CharacterId>(character)
  /** 지금 편집 중인 대화의 id — 저장할 때 같은 항목을 갱신하기 위해 유지한다 */
  const conversationIdRef = useRef<string>(crypto.randomUUID())

  /**
   * transport는 한 번만 만들어져서 캐릭터·언어·음성 여부를 클로저로 가둘 수 없다.
   * ref에 최신 값을 흘려두고 전송 시점(prepareSendMessagesRequest)에 읽는다.
   */
  const live = useRef({ character, locale, voice: false })
  useEffect(() => {
    live.current.character = character
    live.current.locale = locale
  }, [character, locale])

  const [transport] = useState(
    /* live를 읽지만 이 콜백은 렌더가 아니라 요청을 보낼 때 실행되므로
       렌더 결과에 영향을 주지 않는다. */
    // eslint-disable-next-line react-hooks/refs
    () =>
      new DefaultChatTransport<UIMessage>({
        api: '/api/ai/assistant',
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages,
            character: live.current.character,
            locale: live.current.locale,
            voice: live.current.voice,
          },
        }),
      }),
  )

  const { messages, sendMessage, status, setMessages } = useChat({ transport })

  const isLoading = status === 'submitted' || status === 'streaming'
  const hasMessages = messages.length > 0
  const lastIsUser = messages.at(-1)?.role === 'user'

  const textOf = (m: (typeof messages)[number]) =>
    m.parts
      .filter(isTextUIPart)
      .map((p) => p.text)
      .join('')

  /* ── 음성 ─────────────────────────────────────────────── */

  const handleUtterance = useCallback((text: string) => sendMessage({ text }), [sendMessage])

  const {
    supported: voiceSupported,
    isListening,
    isSpeaking,
    interim,
    error: voiceError,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoice({ character, locale, onUtterance: handleUtterance })

  const voiceState: VoiceState = isSpeaking
    ? 'speaking'
    : isLoading
      ? 'thinking'
      : isListening
        ? 'listening'
        : 'idle'

  const lastSpokenIdRef = useRef<string | null>(null)

  const lastAssistantText = useMemo(() => {
    const last = messages.at(-1)
    return last?.role === 'assistant' ? textOf(last) : ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  // 답변이 끝나면 소리내어 읽고, 같은 내용을 노트로 압축해 쌓는다
  useEffect(() => {
    if (!voiceMode || isLoading) return
    const last = messages.at(-1)
    if (!last || last.role !== 'assistant') return
    if (lastSpokenIdRef.current === last.id) return

    const assistantText = textOf(last)
    if (!assistantText.trim()) return
    lastSpokenIdRef.current = last.id

    const userMsg = [...messages].reverse().find((m) => m.role === 'user')
    const userText = userMsg ? textOf(userMsg) : ''

    /*
     * 답변 전문을 그대로 읽으면 너무 길어 듣는 사람이 놓친다.
     * 요약이 돌아오면 그 한 문장만 말하고, 자세한 내용은 화면에 남긴다.
     * 요약이 실패하면 말이 아예 없어지는 게 더 나쁘니 전문으로 되돌린다.
     */
    void fetch('/api/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userText, assistantText, character, locale }),
    })
      .then((r) => r.json())
      .then((note: { title: string | null; points: string[]; spoken: string | null }) => {
        if (note.title || note.points.length > 0) {
          setNotes((prev) => [...prev, { id: last.id, title: note.title, points: note.points }])
        }
        return note.spoken
      })
      .catch(() => null)
      .then((spoken) => speak(spoken || assistantText))
      .then(() => {
        if (live.current.voice) startListening()
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode, isLoading, messages, speak, startListening, locale])

  const exitVoiceMode = useCallback(() => {
    live.current.voice = false
    setVoiceMode(false)
    stopListening()
    stopSpeaking()
  }, [stopListening, stopSpeaking])

  function enterVoiceMode() {
    setVoiceMode(true)
    live.current.voice = true
    // iOS는 사용자 제스처 안에서 첫 재생이 일어나야 이후 재생이 허용된다
    void speak(CHARACTER_META[character].voiceGreeting[locale]).then(() => {
      if (live.current.voice) startListening()
    })
  }

  function toggleMic() {
    if (isListening) {
      stopListening()
    } else {
      stopSpeaking()
      startListening()
    }
  }

  /* ── 기본 동작 ────────────────────────────────────────── */

  useEffect(() => {
    if (prevCharacterRef.current !== character) {
      // 캐릭터가 바뀌면 별개의 대화로 본다 — 기존 기록을 덮어쓰지 않도록 id도 새로 뗀다
      conversationIdRef.current = crypto.randomUUID()
      setMessages([])
      setInputText('')
      setNotes([])
      lastSpokenIdRef.current = null
      prevCharacterRef.current = character
    }
  }, [character, setMessages])

  useEffect(() => {
    if (messages.length > 0 && !voiceMode) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, voiceMode])

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
    if (isOpen && !initialPrompt && !voiceMode) {
      const t = setTimeout(() => inputRef.current?.focus(), 320)
      return () => clearTimeout(t)
    }
  }, [isOpen, initialPrompt, voiceMode])

  // 패널을 닫으면 소리도 멈추고, 다음 오픈을 위해 대화를 초기화한다
  const wasOpenRef = useRef(isOpen)
  useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = isOpen
    if (wasOpen && !isOpen) {
      if (live.current.voice) exitVoiceMode()
      // 슬라이드 닫힘 애니메이션(300ms) 후에 리셋 — 화면에서 깜빡임 없이 사라진 뒤 초기화
      const t = setTimeout(() => {
        conversationIdRef.current = crypto.randomUUID()
        setMessages([])
        setNotes([])
        lastSpokenIdRef.current = null
      }, 350)
      return () => clearTimeout(t)
    }
  }, [isOpen, exitVoiceMode, setMessages])

  /* ── 지난 대화 ────────────────────────────────────────── */

  function openHistory() {
    // 시트를 열 때만 읽는다 — 패널을 여닫을 때마다 스토리지를 훑을 이유가 없다
    setConversations(loadConversations())
    setShowHistory(true)
  }

  // 답변이 끝난 시점에만 저장한다. 스트리밍 도중 저장하면 반쪽짜리 기록이 남는다.
  useEffect(() => {
    if (isLoading || messages.length === 0) return
    if (messages.at(-1)?.role !== 'assistant') return

    setConversations(
      saveConversation({
        id: conversationIdRef.current,
        character,
        title: deriveTitle(messages),
        messages,
        updatedAt: Date.now(),
      }),
    )
  }, [isLoading, messages, character])

  function startNewChat() {
    conversationIdRef.current = crypto.randomUUID()
    setMessages([])
    setNotes([])
    lastSpokenIdRef.current = null
  }

  function openConversation(conv: Conversation) {
    conversationIdRef.current = conv.id
    if (conv.character !== character) {
      // 캐릭터 전환 이펙트가 메시지를 지우지 않도록 기준값을 먼저 맞춘다
      prevCharacterRef.current = conv.character
      setCharacter(conv.character)
    }
    setMessages(conv.messages)
    setNotes([])
    lastSpokenIdRef.current = null
    setShowHistory(false)
  }

  function removeConversation(id: string) {
    setConversations(deleteConversation(id))
    if (id === conversationIdRef.current) startNewChat()
  }

  function handleSend() {
    const text = inputText.trim()
    if (!text || isLoading) return
    setInputText('')
    sendMessage({ text })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // 한글 IME 조합 중에 Enter로 전송하면 마지막 글자가 아직 값에
    // 반영되기 전이라, 전송 후 도착하는 조합 완료 이벤트가 그 글자를
    // 입력창에 다시 채워 넣는다("전송했는데 글자가 남는" 증상). isComposing
    // 동안은 Enter를 전송으로 취급하지 않는다.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && !isComposingRef.current) {
      e.preventDefault()
      handleSend()
    }
  }

  const meta = CHARACTER_META[character]

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col bg-white transition-transform duration-300 ease-out ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {voiceMode ? (
        <VoiceMode
          character={character}
          locale={locale}
          state={voiceState}
          interim={interim}
          spoken={lastAssistantText}
          notes={notes}
          error={voiceError}
          onToggleMic={toggleMic}
          onExit={exitVoiceMode}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between px-3 py-2.5">
            <button
              onClick={close}
              className="active:bg-bg2 flex h-9 w-9 items-center justify-center rounded-full"
              aria-label={t('close')}
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

            <div className="bg-bg2 flex items-center gap-0.5 rounded-full p-1">
              {(['gada', 'rog'] as CharacterId[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCharacter(c)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-all ${
                    character === c ? 'text-ink bg-white shadow-sm' : 'text-ink3'
                  }`}
                >
                  <CharacterAvatar character={c} size="xs" />
                  {CHARACTER_META[c].name[locale]}
                </button>
              ))}
            </div>

            <div className="flex items-center">
              <button
                onClick={openHistory}
                className="active:bg-bg2 flex h-9 w-9 items-center justify-center rounded-full"
                aria-label={t('pastChats')}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="6.6" stroke="var(--color-ink2)" strokeWidth="1.5" />
                  <path
                    d="M9 5.4V9l2.4 1.5"
                    stroke="var(--color-ink2)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <button
                onClick={startNewChat}
                disabled={!hasMessages}
                className="active:bg-bg2 flex h-9 w-9 items-center justify-center rounded-full transition-opacity disabled:opacity-25"
                aria-label={t('newChat')}
              >
                {/* 새 대화 — 통용되는 '작성' 아이콘이라 +보다 뜻이 분명하다 */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M8 3H4.2A1.2 1.2 0 0 0 3 4.2v9.6A1.2 1.2 0 0 0 4.2 15h9.6a1.2 1.2 0 0 0 1.2-1.2V10"
                    stroke="var(--color-ink2)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12.4 2.6a1.4 1.4 0 0 1 2 2L9.6 9.4l-2.6.6.6-2.6 4.8-4.8z"
                    stroke="var(--color-ink2)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {!hasMessages ? (
              <div className="px-5 pt-6 pb-6">
                {/* 캐릭터 소개 — 좌측 정렬 편집형 */}
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0 pb-1">
                    <span className="bg-primary/10 text-primary mb-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold">
                      {meta.type[locale]}
                    </span>
                    <p className="text-ink text-[26px] leading-tight font-bold">
                      {meta.name[locale]}
                    </p>
                    <p className="text-ink3 mt-0.5 text-[13px]">{meta.tagline[locale]}</p>
                  </div>
                  <CharacterFigure character={character} size="md" />
                </div>

                <p className="text-ink2 mt-5 text-[17px] leading-relaxed whitespace-pre-line">
                  {meta.greeting[locale]}
                </p>

                {/* 음성 대화 진입 */}
                {voiceSupported && (
                  <button
                    onClick={enterVoiceMode}
                    className="mt-6 flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left active:opacity-90"
                    style={{ background: meta.color }}
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                      <svg width="17" height="17" viewBox="0 0 26 26" fill="none">
                        <rect
                          x="9.5"
                          y="3"
                          width="7"
                          height="12"
                          rx="3.5"
                          stroke="#fff"
                          strokeWidth="1.9"
                        />
                        <path
                          d="M6 12a7 7 0 0 0 14 0M13 19v3.5"
                          stroke="#fff"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-bold text-white">
                        {t('talkOutLoud')}
                      </span>
                      <span className="block text-[12px] text-white/75">
                        {t('talkOutLoudDesc')}
                      </span>
                    </span>
                  </button>
                )}

                {/* 추천 질문 — 왼쪽 색 띠로 캐릭터와 묶고, 눈썹 문구로 성격을 구분한다 */}
                <p className="text-ink3 mt-7 mb-2.5 pl-0.5 text-[12px] font-semibold">
                  {t('tryAsking')}
                </p>
                <div className="space-y-2">
                  {SUGGESTION_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => sendMessage({ text: t(`suggest.${key}Text` as never) })}
                      className="bg-bg2 group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl py-3 pr-3 pl-4 text-left transition-transform active:scale-[0.98]"
                    >
                      <span
                        className="absolute inset-y-0 left-0 w-[3px]"
                        style={{ background: meta.color }}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className="mb-0.5 block text-[11px] font-bold"
                          style={{ color: meta.color }}
                        >
                          {t(`suggest.${key}Eyebrow` as never)}
                        </span>
                        <span className="text-ink block text-[14px] leading-snug font-medium">
                          {t(`suggest.${key}Text` as never)}
                        </span>
                      </span>
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white">
                        <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
                          <path
                            d="M5.5 3.5l4 4-4 4"
                            stroke="var(--color-ink3)"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 px-4 py-4">
                {messages.map((message) => {
                  const text = textOf(message)

                  if (message.role === 'user') {
                    return (
                      <div key={message.id} className="flex justify-end">
                        <div
                          className="max-w-[78%] rounded-[20px] rounded-br-[6px] px-4 py-2.5 text-[15px] leading-relaxed text-white"
                          style={{ background: meta.color }}
                        >
                          {text}
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={message.id} className="flex items-start gap-2">
                      <CharacterAvatar character={character} size="sm" />
                      <div className="bg-bg2 max-w-[78%] rounded-[20px] rounded-bl-[6px] px-4 py-2.5">
                        {text ? <MarkdownContent text={text} /> : <TypingDots />}
                      </div>
                    </div>
                  )
                })}

                {isLoading && lastIsUser && (
                  <div className="flex items-start gap-2">
                    <CharacterAvatar character={character} size="sm" />
                    <div className="bg-bg2 rounded-[20px] rounded-bl-[6px] px-4 py-2.5">
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
            className="border-border flex-shrink-0 border-t bg-white px-3 pt-2.5"
            style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-end gap-1.5">
              {voiceSupported && (
                <button
                  type="button"
                  onClick={enterVoiceMode}
                  className="bg-bg2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full active:opacity-70"
                  aria-label={t('voiceChat')}
                >
                  <svg width="19" height="19" viewBox="0 0 26 26" fill="none">
                    <rect
                      x="9.5"
                      y="3"
                      width="7"
                      height="12"
                      rx="3.5"
                      stroke="var(--color-ink2)"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M6 12a7 7 0 0 0 14 0M13 19v3.5"
                      stroke="var(--color-ink2)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}

              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => {
                  isComposingRef.current = true
                }}
                onCompositionEnd={() => {
                  isComposingRef.current = false
                }}
                placeholder={t('inputPlaceholder')}
                rows={1}
                className="bg-bg2 text-ink placeholder:text-ink3 flex-1 resize-none rounded-[20px] px-4 py-2.5 text-[15px] outline-none"
                style={{ maxHeight: 120, overflowY: 'auto' }}
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-opacity disabled:opacity-25"
                style={{ background: meta.color }}
                aria-label={t('send')}
              >
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M9 14V4M9 4L5 8M9 4l4 4"
                    stroke="white"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {showHistory && (
        <ConversationHistory
          conversations={conversations}
          locale={locale}
          onOpen={openConversation}
          onDelete={removeConversation}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1" style={{ height: 20 }}>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="bg-ink3 h-1.5 w-1.5 animate-bounce rounded-full"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}
