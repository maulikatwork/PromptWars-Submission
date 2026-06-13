import { FormEvent, useState } from 'react'
import { useUser } from '../context/UserContext'
import type { UserProfile } from '../pages/JournalPage'

const EXAM_OPTIONS = ['JEE', 'NEET', 'CUET', 'CAT', 'GATE', 'UPSC', 'Other'] as const

interface OnboardingModalProps {
  onComplete: (profile: UserProfile) => void
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const { ensureUserId, getAuthHeaders } = useUser()
  const [name, setName] = useState('')
  const [exam, setExam] = useState<(typeof EXAM_OPTIONS)[number]>('JEE')
  const [targetDate, setTargetDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Please enter your name.')
      return
    }

    if (trimmedName.length > 60) {
      setError('Name must be 60 characters or fewer.')
      return
    }

    if (targetDate) {
      const parsedDate = new Date(targetDate)

      if (Number.isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
        setError('Target date must be a future date.')
        return
      }
    }

    setIsSubmitting(true)

    try {
      ensureUserId()
      const payload = {
        name: trimmedName,
        exam,
        targetDate: targetDate || undefined,
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = (await response.json()) as { error?: string }
        throw new Error(body.error ?? 'Failed to save profile')
      }

      const data = (await response.json()) as { profile: UserProfile }
      onComplete({
        ...data.profile,
        targetDate: data.profile.targetDate ?? null,
      })
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="onboarding-title" className="text-xl font-semibold text-neutral-900">
          Tell us a little about your prep
        </h2>
        <p className="mt-2 text-base text-neutral-600">
          This helps the companion stay relevant to your exam journey. No account required.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="onboarding-name" className="block text-sm font-medium text-neutral-700">
              Name
            </label>
            <input
              id="onboarding-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>

          <div>
            <label htmlFor="onboarding-exam" className="block text-sm font-medium text-neutral-700">
              Exam
            </label>
            <select
              id="onboarding-exam"
              value={exam}
              onChange={(event) =>
                setExam(event.target.value as (typeof EXAM_OPTIONS)[number])
              }
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              {EXAM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="onboarding-target-date"
              className="block text-sm font-medium text-neutral-700"
            >
              Target date <span className="text-neutral-500">(optional)</span>
            </label>
            <input
              id="onboarding-target-date"
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
