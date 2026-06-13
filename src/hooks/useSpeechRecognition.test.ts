import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSpeechRecognition } from './useSpeechRecognition'

class MockSpeechRecognition implements SpeechRecognitionInstance {
  lang = ''
  interimResults = false
  continuous = false
  onresult: ((event: SpeechRecognitionEvent) => void) | null = null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null = null
  onend: (() => void) | null = null
  start = vi.fn()
  stop = vi.fn()
}

const MICROPHONE_UNAVAILABLE_MESSAGE = 'Microphone unavailable — please type instead.'
const NO_SPEECH_DETECTED_MESSAGE = 'No speech detected — try again or type instead.'

let latestRecognition: MockSpeechRecognition | null = null

function installSpeechRecognitionMock() {
  latestRecognition = null

  class SpeechRecognitionMock extends MockSpeechRecognition {
    constructor() {
      super()
      latestRecognition = this
    }
  }

  Object.defineProperty(window, 'webkitSpeechRecognition', {
    configurable: true,
    writable: true,
    value: SpeechRecognitionMock,
  })
}

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    Reflect.deleteProperty(window, 'SpeechRecognition')
    Reflect.deleteProperty(window, 'webkitSpeechRecognition')
  })

  afterEach(() => {
    Reflect.deleteProperty(window, 'SpeechRecognition')
    Reflect.deleteProperty(window, 'webkitSpeechRecognition')
    vi.restoreAllMocks()
  })

  it('reports isSupported as false when SpeechRecognition API is absent', () => {
    const { result } = renderHook(() => useSpeechRecognition(() => undefined))

    expect(result.current.isSupported).toBe(false)
    expect(result.current.isListening).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('starts listening after microphone preflight succeeds', async () => {
    installSpeechRecognitionMock()
    const getUserMediaMock = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    })

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: getUserMediaMock,
      },
    })

    const { result } = renderHook(() => useSpeechRecognition(() => undefined))

    await act(async () => {
      await result.current.startListening()
    })

    expect(getUserMediaMock).toHaveBeenCalledWith({ audio: true })
    expect(latestRecognition?.start).toHaveBeenCalledTimes(1)
    expect(result.current.error).toBeNull()
    expect(result.current.isListening).toBe(true)
  })

  it('shows no-speech message when no audio is captured from user', () => {
    installSpeechRecognitionMock()
    const { result } = renderHook(() => useSpeechRecognition(() => undefined))

    act(() => {
      latestRecognition?.onerror?.({ error: 'no-speech' } as SpeechRecognitionErrorEvent)
    })

    expect(result.current.error).toBe(NO_SPEECH_DETECTED_MESSAGE)
    expect(result.current.error).not.toBe(MICROPHONE_UNAVAILABLE_MESSAGE)
  })

  it('does not set an error when user manually stops listening', () => {
    installSpeechRecognitionMock()
    const { result } = renderHook(() => useSpeechRecognition(() => undefined))

    act(() => {
      result.current.stopListening()
      latestRecognition?.onerror?.({ error: 'aborted' } as SpeechRecognitionErrorEvent)
    })

    expect(result.current.error).toBeNull()
    expect(latestRecognition?.stop).toHaveBeenCalledTimes(1)
  })
})
