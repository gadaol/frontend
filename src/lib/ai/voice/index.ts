import { WebSpeechSTT } from './webSpeech'
import { OpenAITTS } from './openaiTTS'
import type { STTEngine, TTSEngine } from './types'

/**
 * 음성 엔진 진입점.
 * TTS: OpenAI (nova/onyx), STT: Web Speech API
 */
let ttsInstance: TTSEngine | null = null
let sttInstance: STTEngine | null = null

export function getTTS(): TTSEngine {
  if (!ttsInstance) ttsInstance = new OpenAITTS()
  return ttsInstance
}

export function getSTT(): STTEngine {
  if (!sttInstance) sttInstance = new WebSpeechSTT()
  return sttInstance
}

export * from './types'
