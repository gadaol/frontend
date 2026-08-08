import type { STTEngine, TTSEngine, SpeakOptions } from './types'

/* ------------------------------------------------------------------ *
 * SpeechRecognition 타입 — lib.dom에 없어서 직접 선언한다.
 * ------------------------------------------------------------------ */
interface SpeechRecognitionAlternative {
  transcript: string
}
interface SpeechRecognitionResult {
  readonly length: number
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionResultList {
  readonly length: number
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const LANG = { ko: 'ko-KR', en: 'en-US' } as const

/* ------------------------------------------------------------------ *
 * TTS
 * ------------------------------------------------------------------ */

/**
 * 보이스 목록은 비동기로 채워진다. 크롬은 첫 호출에서 빈 배열을 주고
 * voiceschanged 이후에야 실제 목록이 들어오므로 한 번 기다려준다.
 */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = speechSynthesis.getVoices()
    if (existing.length > 0) return resolve(existing)

    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      speechSynthesis.onvoiceschanged = null
      resolve(speechSynthesis.getVoices())
    }
    speechSynthesis.onvoiceschanged = done
    setTimeout(done, 1000)
  })
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: string,
  preferred: string[] = [],
): SpeechSynthesisVoice | null {
  const sameLang = voices.filter((v) => v.lang.replace('_', '-').startsWith(lang.slice(0, 2)))
  const pool = sameLang.length > 0 ? sameLang : voices

  for (const name of preferred) {
    const hit = pool.find((v) => v.name.includes(name))
    if (hit) return hit
  }
  return pool[0] ?? null
}

export class WebSpeechTTS implements TTSEngine {
  readonly name = 'web-speech'

  isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  async speak(text: string, { profile, locale, onStart, onEnd }: SpeakOptions): Promise<void> {
    if (!this.isSupported() || !text.trim()) {
      onEnd?.()
      return
    }

    this.stop()

    const lang = LANG[locale]
    const voices = await loadVoices()
    const voice = pickVoice(voices, lang, profile.preferredVoices)

    return new Promise<void>((resolve) => {
      const utter = new SpeechSynthesisUtterance(stripForSpeech(text))
      utter.lang = lang
      utter.pitch = profile.pitch
      utter.rate = profile.rate
      utter.volume = profile.volume
      if (voice) utter.voice = voice

      let finished = false
      const finish = () => {
        if (finished) return
        finished = true
        onEnd?.()
        resolve()
      }

      utter.onstart = () => onStart?.()
      utter.onend = finish
      utter.onerror = finish

      speechSynthesis.speak(utter)
    })
  }

  stop() {
    if (!this.isSupported()) return
    speechSynthesis.cancel()
  }
}

/**
 * 마크다운 기호와 이모지는 소리내어 읽으면 어색하므로 걷어낸다.
 */
function stripForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/[>|]/g, ' ')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/* ------------------------------------------------------------------ *
 * STT
 * ------------------------------------------------------------------ */

export class WebSpeechSTT implements STTEngine {
  readonly name = 'web-speech'
  private recognition: SpeechRecognitionLike | null = null

  isSupported() {
    return getRecognitionCtor() !== null
  }

  start({
    locale,
    onResult,
    onEnd,
    onError,
  }: {
    locale: 'ko' | 'en'
    onResult: (r: { transcript: string; isFinal: boolean }) => void
    onEnd: () => void
    onError: (e: string) => void
  }) {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return onError('unsupported')

    this.stop()

    const rec = new Ctor()
    rec.lang = LANG[locale]
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onresult = (e) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        const chunk = result[0]?.transcript ?? ''
        if (result.isFinal) final += chunk
        else interim += chunk
      }
      if (final) onResult({ transcript: final, isFinal: true })
      else if (interim) onResult({ transcript: interim, isFinal: false })
    }

    // no-speech / aborted는 사용자가 잠깐 말을 멈춘 정상 상황이라 에러로 올리지 않는다.
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      onError(e.error)
    }
    rec.onend = () => onEnd()

    this.recognition = rec
    try {
      rec.start()
    } catch {
      onError('start-failed')
    }
  }

  stop() {
    if (!this.recognition) return
    this.recognition.onresult = null
    this.recognition.onerror = null
    this.recognition.onend = null
    try {
      this.recognition.abort()
    } catch {
      /* 이미 정지된 경우 무시 */
    }
    this.recognition = null
  }
}
