import { useEffect, useState } from 'react'
import { useUser } from '../context/UserContext'
import OnboardingModal from '../components/OnboardingModal'

const USER_PROFILE_KEY = 'user_profile'

export interface UserProfile {
  name: string
  exam: string
  targetDate: string | null
}

function readStoredProfile(): UserProfile | null {
  const raw = localStorage.getItem(USER_PROFILE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as UserProfile
  } catch {
    return null
  }
}

export default function JournalPage() {
  const { ensureUserId } = useUser()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(() => readStoredProfile())

  useEffect(() => {
    ensureUserId()

    if (!readStoredProfile()) {
      setShowOnboarding(true)
    }
  }, [ensureUserId])

  const handleOnboardingComplete = (nextProfile: UserProfile) => {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(nextProfile))
    setProfile(nextProfile)
    setShowOnboarding(false)
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-neutral-900">Journal</h1>
        <p className="mt-2 text-base text-neutral-600">
          {profile
            ? `Welcome back, ${profile.name}. Your journaling space will be ready in the next phase.`
            : 'Your private journaling space will be ready in the next phase.'}
        </p>
      </div>

      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
    </main>
  )
}
