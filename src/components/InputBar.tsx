import { KeyboardEvent, useCallback, useEffect, useRef } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'

interface InputBarProps {
  inputText: string
  onInputChange: (value: string) => void
  onSend: () => void
  isLoading: boolean
}

const MAX_TEXTAREA_ROWS = 5

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}

export default function InputBar({ inputText, onInputChange, onSend, isLoading }: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleTranscript = useCallback(
    (transcript: string) => {
      const trimmedTranscript = transcript.trim()

      if (!trimmedTranscript) {
        return
      }

      const nextValue = inputText ? `${inputText} ${trimmedTranscript}` : trimmedTranscript
      onInputChange(nextValue)
    },
    [inputText, onInputChange],
  )

  const { isListening, isSupported, error, startListening, stopListening } =
    useSpeechRecognition(handleTranscript)

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = 'auto'
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10) || 24
    const maxHeight = lineHeight * MAX_TEXTAREA_ROWS
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
  }, [])

  useEffect(() => {
    resizeTextarea()
  }, [inputText, resizeTextarea])

  const canSend = inputText.trim().length > 0 && !isLoading

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()

      if (canSend) {
        onSend()
      }
    }
  }

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="sticky bottom-0 border-t border-neutral-200 bg-white px-4 py-3 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <label htmlFor="journal-input" className="sr-only">
          Journal message
        </label>
        <textarea
          ref={textareaRef}
          id="journal-input"
          rows={1}
          value={inputText}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="What's on your mind?"
          className="max-h-[120px] min-h-[44px] flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2 text-base text-neutral-800 placeholder:text-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-60"
        />

        {isSupported && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isLoading}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            className={`flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-60 ${
              isListening ? 'animate-pulse ring-2 ring-red-400' : ''
            }`}
          >
            {isListening ? <StopIcon /> : <MicIcon />}
          </button>
        )}

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white transition hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SendIcon />
        </button>
      </div>

      {error && (
        <p className="mx-auto mt-2 max-w-2xl text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
