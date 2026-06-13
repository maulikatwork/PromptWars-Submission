import { createContext, useCallback, useContext, useMemo, useState } from 'react'

// MVP internal testing only: no login, passwords, or tokens. Identity is an anonymous
// UUID stored in localStorage — not a substitute for production authentication.
const USER_ID_KEY = 'user_id'

interface UserContextValue {
  userId: string | null
  ensureUserId: () => string
  getAuthHeaders: () => HeadersInit
}

const UserContext = createContext<UserContextValue | null>(null)

function readStoredUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY)
}

function createUserId(): string {
  const userId = crypto.randomUUID()
  localStorage.setItem(USER_ID_KEY, userId)
  return userId
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(() => readStoredUserId())

  const ensureUserId = useCallback(() => {
    const existing = readStoredUserId()

    if (existing) {
      setUserId(existing)
      return existing
    }

    const newUserId = createUserId()
    setUserId(newUserId)
    return newUserId
  }, [])

  const getAuthHeaders = useCallback((): HeadersInit => {
    const id = userId ?? readStoredUserId()

    if (!id) {
      return { 'Content-Type': 'application/json' }
    }

    return {
      'Content-Type': 'application/json',
      'X-User-ID': id,
    }
  }, [userId])

  const value = useMemo(
    () => ({
      userId,
      ensureUserId,
      getAuthHeaders,
    }),
    [userId, ensureUserId, getAuthHeaders],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext)

  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }

  return context
}
