export interface BackendStatus {
  status: string
  service: string
  version: string
  timestamp: string
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
}

