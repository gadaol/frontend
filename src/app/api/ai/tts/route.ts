import { NextRequest } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { text, voice } = (await req.json()) as { text: string; voice: string }
  if (!text?.trim()) return new Response('', { status: 400 })

  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: (voice ?? 'nova') as 'nova' | 'onyx' | 'alloy' | 'echo' | 'fable' | 'shimmer',
    input: text,
  })

  const buffer = Buffer.from(await response.arrayBuffer())
  return new Response(buffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
    },
  })
}
