import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useSpeechRecognition } from './useSpeechRecognition'

describe('useSpeechRecognition', () => {
  it('reports isSupported as false when SpeechRecognition API is absent', () => {
    const { result } = renderHook(() => useSpeechRecognition(() => undefined))

    expect(result.current.isSupported).toBe(false)
    expect(result.current.isListening).toBe(false)
    expect(result.current.error).toBeNull()
  })
})
