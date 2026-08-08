'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getSTT, getTTS, VOICE_PROFILES } from '@/lib/ai/voice'
import type { CharacterId, Locale } from '@/lib/ai/characters'

interface Options {
  character: CharacterId
  locale: Locale
  /** 사용자가 한 문장을 끝냈을 때 (침묵으로 확정된 발화) */
  onUtterance: (text: string) => void
}

/** 마지막 발화 후 이 시간만큼 조용하면 한 문장이 끝난 것으로 본다 */
const SILENCE_MS = 1400

export function useVoice({ character, locale, onUtterance }: Options) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)

  const bufferRef = useRef('')
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listeningRef = useRef(false)
  // 콜백을 ref로 들고 있어야 stt를 재시작하지 않고도 최신 핸들러를 쓴다
  const onUtteranceRef = useRef(onUtterance)
  useEffect(() => {
    onUtteranceRef.current = onUtterance
  }, [onUtterance])

  /**
   * 지원 여부는 브라우저에서만 알 수 있다. 첫 렌더에서 곧바로 판정하면
   * 서버(false)와 클라이언트(true)의 결과가 달라져 하이드레이션이 깨지므로,
   * 마운트 이후에 한 번 켠다.
   */
  const [supported, setSupported] = useState(false)
  useEffect(() => {
    // 마운트 후 1회만 판정한다 (위 주석 참고).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(getSTT().isSupported() && getTTS().isSupported())
  }, [])

  const clearSilence = () => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
    silenceTimer.current = null
  }

  const flush = useCallback(() => {
    clearSilence()
    const text = bufferRef.current.trim()
    bufferRef.current = ''
    setInterim('')
    if (text) onUtteranceRef.current(text)
  }, [])

  const stopListening = useCallback(() => {
    clearSilence()
    listeningRef.current = false
    getSTT().stop()
    setIsListening(false)
    setInterim('')
    bufferRef.current = ''
  }, [])

  /**
   * 실제 인식 세션 하나를 연다.
   * 브라우저가 침묵을 이유로 세션을 임의 종료하는 일이 잦아서,
   * 사용자가 멈추라고 한 게 아니면 onEnd에서 스스로 다시 연다.
   */
  const openSessionRef = useRef<() => void>(() => {})

  const openSession = useCallback(() => {
    getSTT().start({
      locale,
      onResult: ({ transcript, isFinal }) => {
        clearSilence()
        if (isFinal) {
          bufferRef.current = `${bufferRef.current} ${transcript}`.trim()
          setInterim(bufferRef.current)
        } else {
          setInterim(`${bufferRef.current} ${transcript}`.trim())
        }
        silenceTimer.current = setTimeout(flush, SILENCE_MS)
      },
      onEnd: () => {
        if (listeningRef.current) openSessionRef.current()
      },
      onError: (e) => {
        setError(e)
        listeningRef.current = false
        setIsListening(false)
      },
    })
  }, [locale, flush])

  useEffect(() => {
    openSessionRef.current = openSession
  }, [openSession])

  const startListening = useCallback(() => {
    if (listeningRef.current) return
    setError(null)
    // 스피커 소리가 마이크로 다시 들어가지 않도록 재생을 먼저 끊는다
    getTTS().stop()
    setIsSpeaking(false)

    listeningRef.current = true
    setIsListening(true)
    openSession()
  }, [openSession])

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return
      // 말하는 동안은 듣지 않는다 (에코 방지)
      const wasListening = listeningRef.current
      if (wasListening) stopListening()

      await getTTS().speak(text, {
        profile: VOICE_PROFILES[character],
        locale,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      })
    },
    [character, locale, stopListening],
  )

  const stopSpeaking = useCallback(() => {
    getTTS().stop()
    setIsSpeaking(false)
  }, [])

  useEffect(() => {
    return () => {
      clearSilence()
      listeningRef.current = false
      getSTT().stop()
      getTTS().stop()
    }
  }, [])

  return {
    supported,
    isListening,
    isSpeaking,
    interim,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  }
}
