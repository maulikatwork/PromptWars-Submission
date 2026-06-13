import { useCallback, useEffect, useRef, useState } from 'react'

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export function useSpeechRecognition(onTranscript: (text: string) => void): {
  isListening: boolean
  isSupported: boolean
  error: string | null
  startListening: () => void
  stopListening: () => void
} {
  const onTranscriptRef = useRef(onTranscript)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported] = useState(() => getSpeechRecognitionConstructor() !== null)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    const SpeechRecognitionClass = getSpeechRecognitionConstructor()

    if (!SpeechRecognitionClass) {
      return
    }

    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript

      if (transcript) {
        onTranscriptRef.current(transcript)
      }
    }

    recognition.onerror = () => {
      setError('Microphone unavailable — please type instead.')
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current

    if (!recognition || isListening) {
      return
    }

    setError(null)

    try {
      recognition.start()
      setIsListening(true)
    } catch {
      setError('Microphone unavailable — please type instead.')
      setIsListening(false)
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return {
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
  }
}
