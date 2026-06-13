export const USER_PROFILE_KEY = 'user_profile'

export interface UserProfile {
  name: string
  exam: string
  targetDate: string | null
}

export function readStoredProfile(): UserProfile | null {
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
