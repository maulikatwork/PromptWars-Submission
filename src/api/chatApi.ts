import type { DistressLevel } from '../types/messages'

export interface ChatResponse {
  reply: string
  entryId: string
  distressLevel: DistressLevel
}

export class ChatApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ChatApiError'
    this.status = status
  }
}

export async function sendMessage(
  rawText: string,
  userId: string,
): Promise<ChatResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
    },
    body: JSON.stringify({ rawText }),
  })

  if (!response.ok) {
    let message = 'Something went wrong. Please try again.'

    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) {
        message = body.error
      }
    } catch {
      // Use default message when response body is not JSON.
    }

    throw new ChatApiError(response.status, message)
  }

  return response.json() as Promise<ChatResponse>
}
