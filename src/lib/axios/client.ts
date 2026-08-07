import axios, { AxiosError } from 'axios'

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    public data: Record<string, unknown> = {},
  ) {
    super(code)
    this.name = 'ApiError'
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}

const client = axios.create({
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ errorCode?: string } & Record<string, unknown>>) => {
    const status = err.response?.status ?? 500
    if (status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      return
    }
    const code = err.response?.data?.errorCode ?? 'unknown'
    const data = (err.response?.data ?? {}) as Record<string, unknown>
    throw new ApiError(code, status, data)
  },
)

export default client
