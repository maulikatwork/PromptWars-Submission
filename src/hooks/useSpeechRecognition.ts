import { useCallback, useEffect, useRef, useState } from 'react'

const MICROPHONE_UNAVAILABLE_MESSAGE = 'Microphone unavailable — please type instead.'
const VOICE_INPUT_RETRY_MESSAGE = 'Voice input failed — please try again or type instead.'
const NO_SPEECH_DETECTED_MESSAGE = 'No speech detected — try again or type instead.'

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

function getSpeechRecognitionErrorMessage(
  errorCode: string | undefined,
  isUserStopRef: { current: boolean },
): string | null {
  if (errorCode === 'aborted' && isUserStopRef.current) {
    isUserStopRef.current = false
    return null
  }

  switch (errorCode) {
    case 'audio-capture':
    case 'not-allowed':
    case 'service-not-allowed':
      return MICROPHONE_UNAVAILABLE_MESSAGE
    case 'no-speech':
      return NO_SPEECH_DETECTED_MESSAGE
    default:
      return VOICE_INPUT_RETRY_MESSAGE
  }
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
  const isUserStopRef = useRef(false)
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

    recognition.onerror = (event) => {
      const nextError = getSpeechRecognitionErrorMessage(event.error, isUserStopRef)
      if (nextError) {
        setError(nextError)
      }
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

  const startListening = useCallback(async () => {
    const recognition = recognitionRef.current

    if (!recognition || isListening) {
      return
    }

    setError(null)

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((track) => track.stop())
      } catch {
        setError(MICROPHONE_UNAVAILABLE_MESSAGE)
        setIsListening(false)
        return
      }
    }

    try {
      recognition.start()
      setIsListening(true)
    } catch {
      setError(VOICE_INPUT_RETRY_MESSAGE)
      setIsListening(false)
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    isUserStopRef.current = true
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
