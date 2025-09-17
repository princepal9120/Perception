// API client with filtering capabilities for backend calls
export interface ApiRequest {
  url: string
  method: "GET" | "POST" | "PUT" | "DELETE"
  headers?: Record<string, string>
  body?: any
  timestamp: Date
}

export interface ApiResponse {
  status: number
  data: any
  headers: Record<string, string>
  timestamp: Date
  duration: number
}

export interface ApiFilter {
  method?: string[]
  status?: number[]
  urlPattern?: string
  dateRange?: {
    start: Date
    end: Date
  }
}

class ApiClient {
  private requests: (ApiRequest & { response?: ApiResponse })[] = []
  private listeners: ((request: ApiRequest, response?: ApiResponse) => void)[] = []

  // Add listener for API call monitoring
  addListener(callback: (request: ApiRequest, response?: ApiResponse) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback)
    }
  }

  // Filter API calls based on criteria
  filterRequests(filter: ApiFilter): (ApiRequest & { response?: ApiResponse })[] {
    return this.requests.filter((req) => {
      // Filter by method
      if (filter.method && !filter.method.includes(req.method)) {
        return false
      }

      // Filter by status code
      if (filter.status && req.response && !filter.status.includes(req.response.status)) {
        return false
      }

      // Filter by URL pattern
      if (filter.urlPattern && !req.url.includes(filter.urlPattern)) {
        return false
      }

      // Filter by date range
      if (filter.dateRange) {
        const reqTime = req.timestamp.getTime()
        const startTime = filter.dateRange.start.getTime()
        const endTime = filter.dateRange.end.getTime()
        if (reqTime < startTime || reqTime > endTime) {
          return false
        }
      }

      return true
    })
  }

  // Get all requests
  getAllRequests(): (ApiRequest & { response?: ApiResponse })[] {
    return [...this.requests]
  }

  // Clear request history
  clearHistory() {
    this.requests = []
  }

  // Main API call method with automatic logging
  async request<T = any>(
    url: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "DELETE"
      headers?: Record<string, string>
      body?: any
    } = {},
  ): Promise<T> {
    const startTime = Date.now()
    const request: ApiRequest = {
      url,
      method: options.method || "GET",
      headers: options.headers || {},
      body: options.body,
      timestamp: new Date(),
    }

    // Notify listeners about the request
    this.listeners.forEach((listener) => listener(request))

    try {
      const fetchOptions: RequestInit = {
        method: request.method,
        headers: {
          "Content-Type": "application/json",
          ...request.headers,
        },
      }

      if (request.body && request.method !== "GET") {
        fetchOptions.body = JSON.stringify(request.body)
      }

      const response = await fetch(url, fetchOptions)
      const data = await response.json()
      const endTime = Date.now()

      const apiResponse: ApiResponse = {
        status: response.status,
        data,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date(),
        duration: endTime - startTime,
      }

      // Store request with response
      const requestWithResponse = { ...request, response: apiResponse }
      this.requests.push(requestWithResponse)

      // Notify listeners about the response
      this.listeners.forEach((listener) => listener(request, apiResponse))

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      return data
    } catch (error) {
      // Store failed request
      this.requests.push(request)
      throw error
    }
  }

  // Convenience methods
  async get<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: "GET", headers })
  }

  async post<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: "POST", body, headers })
  }

  async put<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: "PUT", body, headers })
  }

  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: "DELETE", headers })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Chat-specific API functions
export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ChatResponse {
  message: string
  id: string
}

export interface StreamingChatEvent {
  type: "checkpoint" | "content" | "tool_output" | "end"
  checkpoint_id?: string
  content?: string
  output?: any
}

// Base URL for the FastAPI backend
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export async function* streamChatMessage(
  message: string,
  checkpointId?: string
): AsyncGenerator<StreamingChatEvent, void, unknown> {
  const url = new URL(`${BACKEND_URL}/chat_stream/${encodeURIComponent(message)}`)
  if (checkpointId) {
    url.searchParams.append('checkpoint_id', checkpointId)
  }

  const request: ApiRequest = {
    url: url.toString(),
    method: "GET",
    headers: {},
    body: null,
    timestamp: new Date(),
  }

  // Notify listeners about the request
  apiClient['listeners'].forEach((listener) => listener(request))

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No response body reader available')
    }

    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Process complete lines
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6)) as StreamingChatEvent
            yield data
          } catch (e) {
            console.warn('Failed to parse SSE data:', line)
          }
        }
      }
    }
  } catch (error) {
    console.error('Streaming error:', error)
    throw error
  }
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<ChatResponse> {
  // Legacy function for backward compatibility
  const lastMessage = messages[messages.length - 1]?.content || ""

  let fullResponse = ""
  let checkpointId = ""

  for await (const event of streamChatMessage(lastMessage)) {
    if (event.type === "checkpoint" && event.checkpoint_id) {
      checkpointId = event.checkpoint_id
    } else if (event.type === "content" && event.content) {
      fullResponse += event.content
    }
  }

  return {
    message: fullResponse,
    id: checkpointId || Date.now().toString()
  }
}

export async function createNewChat(): Promise<{ id: string; title: string }> {
  // Generate a new chat ID
  const id = Date.now().toString()
  return { id, title: `Chat ${id}` }
}

export async function getChatHistory(chatId: string): Promise<ChatMessage[]> {
  // For now, return empty array as the backend maintains conversation state
  // through checkpoints
  return []
}

export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  // Placeholder for future implementation
  return Promise.resolve()
}
