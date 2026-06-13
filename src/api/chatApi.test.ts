import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChatApiError, sendMessage } from './chatApi'

describe('sendMessage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns parsed chat response on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          reply: 'That sounds tough.',
          entryId: 'entry-1',
          distressLevel: 1,
        }),
      }),
    )

    const result = await sendMessage('Feeling stressed', 'user-123')

    expect(result).toEqual({
      reply: 'That sounds tough.',
      entryId: 'entry-1',
      distressLevel: 1,
    })
    expect(fetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': 'user-123',
      },
      body: JSON.stringify({ rawText: 'Feeling stressed' }),
    })
  })

  it('throws ChatApiError with server message on non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Too many requests. Please wait a moment.' }),
      }),
    )

    await expect(sendMessage('Hello', 'user-123')).rejects.toEqual(
      expect.objectContaining({
        name: 'ChatApiError',
        status: 429,
        message: 'Too many requests. Please wait a moment.',
      }),
    )
  })

  it('throws ChatApiError with fallback message when body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => {
          throw new Error('invalid json')
        },
      }),
    )

    await expect(sendMessage('Hello', 'user-123')).rejects.toBeInstanceOf(ChatApiError)
  })
})
