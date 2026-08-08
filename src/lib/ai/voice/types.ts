import type { CharacterId, Locale } from '../characters'

/**
 * 캐릭터별 음색 설정.
 * Web Speech는 pitch/rate만 조절 가능하지만, 나중에 ElevenLabs 같은
 * 외부 TTS로 갈아끼울 때를 위해 voiceId 슬롯을 미리 열어둔다.
 */
export interface VoiceProfile {
  /** 0.5 ~ 2.0. 높을수록 밝고 어린 톤 */
  pitch: number
  /** 0.5 ~ 2.0. 말하기 속도 */
  rate: number
  /** 0 ~ 1 */
  volume: number
  /** 외부 TTS 엔진용 보이스 식별자. Web Speech에서는 미사용 */
  voiceId?: string
  /** 브라우저 보이스 이름 우선순위 (앞쪽이 먼저 선택됨) */
  preferredVoices?: string[]
}

export interface SpeakOptions {
  profile: VoiceProfile
  locale: Locale
  /** 재생이 실제로 시작될 때 */
  onStart?: () => void
  /** 정상 종료 또는 중단 시 */
  onEnd?: () => void
}

/**
 * TTS 엔진 인터페이스.
 * 구현체를 갈아끼우면 AssistantPanel 코드는 그대로 둔 채 목소리만 바뀐다.
 */
export interface TTSEngine {
  readonly name: string
  isSupported(): boolean
  speak(text: string, options: SpeakOptions): Promise<void>
  stop(): void
}

export interface STTResult {
  transcript: string
  isFinal: boolean
}

export interface STTEngine {
  readonly name: string
  isSupported(): boolean
  start(options: {
    locale: Locale
    onResult: (result: STTResult) => void
    onEnd: () => void
    onError: (error: string) => void
  }): void
  stop(): void
}

/**
 * 가다는 높고 빠르게, 로그는 낮고 조금 느리게 — 둘의 차이는 유지한다.
 *
 * 한국어 보이스는 기기에 하나뿐인 경우가 많아(macOS/iOS는 "유나" 단독)
 * 실질적인 캐릭터 구분은 pitch/rate가 전담한다. 그래서 차이를 넉넉히 벌려뒀다.
 * 다만 둘 다 기본값(1.0)보다 빠르게 둔다 — 기본 속도로는 듣기 답답하다.
 * 보이스 이름은 OS 언어에 따라 현지화되므로 한글·영문 표기를 모두 넣는다.
 */
export const VOICE_PROFILES: Record<CharacterId, VoiceProfile> = {
  gada: {
    pitch: 1.35,
    rate: 1.32,
    volume: 1,
    preferredVoices: ['유나', 'Yuna', 'Google 한국의', 'Samantha'],
  },
  rog: {
    pitch: 0.62,
    rate: 1.14,
    volume: 1,
    preferredVoices: ['유나', 'Yuna', 'Google 한국의', 'Daniel'],
  },
}
