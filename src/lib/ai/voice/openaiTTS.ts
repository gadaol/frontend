import type { TTSEngine, SpeakOptions } from './types'

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

export class OpenAITTS implements TTSEngine {
  readonly name = 'openai'
  private audio: HTMLAudioElement | null = null
  private blobUrl: string | null = null
  private abortController: AbortController | null = null

  isSupported() {
    return typeof window !== 'undefined'
  }

  async speak(text: string, { profile, onStart, onEnd }: SpeakOptions): Promise<void> {
    if (!text.trim()) {
      onEnd?.()
      return
    }

    this.stop()

    const cleaned = stripForSpeech(text)
    const voice = profile.voiceId ?? 'nova'
    this.abortController = new AbortController()

    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleaned, voice }),
        signal: this.abortController.signal,
      })

      if (!res.ok) {
        onEnd?.()
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      this.blobUrl = url

      return new Promise<void>((resolve) => {
        const audio = new Audio(url)
        this.audio = audio

        audio.onplay = () => onStart?.()
        audio.onended = () => {
          this.cleanup()
          onEnd?.()
          resolve()
        }
        audio.onerror = () => {
          this.cleanup()
          onEnd?.()
          resolve()
        }

        audio.play().catch(() => {
          this.cleanup()
          onEnd?.()
          resolve()
        })
      })
    } catch (e) {
      if (!(e instanceof Error && e.name === 'AbortError')) onEnd?.()
    }
  }

  stop() {
    this.abortController?.abort()
    this.abortController = null
    if (this.audio) {
      this.audio.pause()
      this.audio.onplay = null
      this.audio.onended = null
      this.audio.onerror = null
      this.audio = null
    }
    this.cleanup()
  }

  private cleanup() {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl)
      this.blobUrl = null
    }
  }
}
