import { createCerebras } from '@ai-sdk/cerebras'

export const cerebras = createCerebras({
  apiKey: process.env.CEREBRAS_API_KEY!,
})

export const MODELS = {
  default: 'llama-3.3-70b',
  fast: 'llama3.1-8b',
} as const
