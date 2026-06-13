import { useCallback, useEffect, useRef, useState } from 'react'
import { sendMessage } from '../api/chatApi'
import CrisisBanner from '../components/CrisisBanner'
import InputBar from '../components/InputBar'
import MessageBubble from '../components/MessageBubble'
import OnboardingModal from '../components/OnboardingModal'
import StickyHeader from '../components/StickyHeader'
import ThinkingIndicator from '../components/ThinkingIndicator'
import { useUser } from '../context/UserContext'
import type { DistressLevel, Message } from '../types/messages'
import {
  readStoredProfile,
  USER_PROFILE_KEY,
  type UserProfile,
} from '../types/user'

function createOpeningMessage(profile: UserProfile): Message {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: `Hi ${profile.name}! I'm here to listen — how are you feeling about your ${profile.exam} prep today?`,
    timestamp: new Date(),
  }
}

export default function JournalPage() {
  const { ensureUserId, userId } = useUser()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(() => readStoredProfile())
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [distressLevel, setDistressLevel] = useState<DistressLevel>(0)
  const [isBannerDismissed, setIsBannerDismissed] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ensureUserId()

    if (!readStoredProfile()) {
      setShowOnboarding(true)
    }
  }, [ensureUserId])

  useEffect(() => {
    if (profile && messages.length === 0) {
      setMessages([createOpeningMessage(profile)])
    }
  }, [profile, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleOnboardingComplete = (nextProfile: UserProfile) => {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(nextProfile))
    setProfile(nextProfile)
    setMessages([createOpeningMessage(nextProfile)])
    setShowOnboarding(false)
  }

  const handleSend = useCallback(async () => {
    const trimmedText = inputText.trim()

    if (!trimmedText || isLoading || !profile) {
      return
    }

    const activeUserId = userId ?? ensureUserId()
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedText,
      timestamp: new Date(),
    }

    setMessages((previous) => [...previous, userMessage])
    setInputText('')
    setSendError(null)
    setIsLoading(true)

    try {
      const response = await sendMessage(trimmedText, activeUserId)

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
      }

      setMessages((previous) => [...previous, assistantMessage])
      setDistressLevel(response.distressLevel)

      if (response.distressLevel >= 2) {
        setIsBannerDismissed(false)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      setSendError(message)
    } finally {
      setIsLoading(false)
    }
  }, [inputText, isLoading, profile, userId, ensureUserId])

  const showCrisisBanner = distressLevel >= 2 && !isBannerDismissed

  if (!profile && !showOnboarding) {
    return (
      <main className="flex h-dvh items-center justify-center">
        <p className="text-base text-neutral-600">Loading your journal...</p>
      </main>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-neutral-50">
      {profile && <StickyHeader studentName={profile.name} />}

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4 lg:max-w-2xl">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isLoading && <ThinkingIndicator />}
          {sendError && (
            <p className="text-sm text-red-600" role="alert">
              {sendError}
            </p>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {showCrisisBanner && (
        <CrisisBanner
          distressLevel={distressLevel}
          onDismiss={distressLevel === 2 ? () => setIsBannerDismissed(true) : undefined}
        />
      )}

      {profile && (
        <InputBar
          inputText={inputText}
          onInputChange={setInputText}
          onSend={handleSend}
          isLoading={isLoading}
        />
      )}

      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
    </div>
  )
}
