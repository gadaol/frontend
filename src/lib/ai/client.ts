import { createCerebras } from '@ai-sdk/cerebras'

export const cerebras = createCerebras({
  apiKey: process.env.CEREBRAS_API_KEY!,
})

export const MODELS = {
  default: 'gpt-oss-120b',
  fast: 'gemma-4-31b',
} as const
