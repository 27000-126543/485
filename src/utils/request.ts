import { useUserStore } from '../store/userStore'

const BASE_URL = '/api'

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
  skipAuth?: boolean
}

interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

function buildUrlParams(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, skipAuth = false, headers, ...restOptions } = options

  const url = `${BASE_URL}${endpoint}${params ? buildUrlParams(params) : ''}`

  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (!skipAuth) {
    const token = useUserStore.getState().token
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch(url, {
    ...restOptions,
    headers: requestHeaders,
  })

  if (response.status === 401) {
    useUserStore.getState().logout()
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    throw new Error('登录已过期，请重新登录')
  }

  let data: any
  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`)
    }
    return {} as T
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || `请求失败: ${response.status}`)
  }

  if (data.success === false) {
    throw new Error(data.message || data.error || '请求失败')
  }

  return data.data ?? (data as unknown as T)
}

const http = {
  get: <T = unknown>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'GET' }),

  post: <T = unknown>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T = unknown>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T = unknown>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T = unknown>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'DELETE' }),
}

export default http
export { request, BASE_URL }
export type { RequestOptions, ApiResponse }
