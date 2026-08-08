import { WebSpeechSTT, WebSpeechTTS } from './webSpeech'
import type { STTEngine, TTSEngine } from './types'

/**
 * 음성 엔진 진입점.
 *
 * 나중에 ElevenLabs/OpenAI TTS로 바꾸려면 여기서 반환하는 구현체만
 * 교체하면 된다. useVoice와 AssistantPanel은 인터페이스만 알고 있다.
 */
let ttsInstance: TTSEngine | null = null
let sttInstance: STTEngine | null = null

export function getTTS(): TTSEngine {
  if (!ttsInstance) ttsInstance = new WebSpeechTTS()
  return ttsInstance
}

export function getSTT(): STTEngine {
  if (!sttInstance) sttInstance = new WebSpeechSTT()
  return sttInstance
}

export * from './types'
