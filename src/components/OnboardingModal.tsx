import { FormEvent, useEffect, useRef, useState } from 'react'
import { useUser } from '../context/UserContext'
import type { UserProfile } from '../types/user'

const EXAM_OPTIONS = ['JEE', 'NEET', 'CUET', 'CAT', 'GATE', 'UPSC', 'Other'] as const

interface OnboardingModalProps {
  onComplete: (profile: UserProfile) => void
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const { ensureUserId, getAuthHeaders } = useUser()
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [exam, setExam] = useState<(typeof EXAM_OPTIONS)[number] | ''>('')
  const [targetDate, setTargetDate] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [targetDateError, setTargetDateError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    nameInputRef.current?.focus()
  }, [])

  const isFormValid = name.trim().length > 0 && exam !== ''

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNameError(null)
    setTargetDateError(null)
    setSubmitError(null)

    const trimmedName = name.trim()

    if (!trimmedName) {
      setNameError('Please enter your name.')
      return
    }

    if (trimmedName.length > 60) {
      setNameError('Name must be 60 characters or fewer.')
      return
    }

    if (!exam) {
      return
    }

    if (targetDate) {
      const parsedDate = new Date(targetDate)

      if (Number.isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
        setTargetDateError('Target date must be a future date.')
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fadeIn items-center justify-center bg-black/30 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="mx-4 w-full max-w-sm animate-slideUp rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="onboarding-title" className="text-xl font-semibold text-neutral-900">
          Tell us a little about your prep
        </h2>
        <p className="mt-2 text-base text-neutral-600">
          This helps Antarman stay relevant to your exam journey.
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Your data is stored anonymously. No account needed.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
              Name
            </label>
            <input
              ref={nameInputRef}
              id="name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setNameError(null)
              }}
              maxLength={60}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            />
            {nameError && (
              <span className="mt-1 block text-sm text-red-600" role="alert">
                {nameError}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="exam" className="block text-sm font-medium text-neutral-700">
              Exam
            </label>
            <select
              id="exam"
              value={exam}
              onChange={(event) =>
                setExam(event.target.value as (typeof EXAM_OPTIONS)[number] | '')
              }
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            >
              <option value="" disabled>
                Select your exam
              </option>
              {EXAM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="targetDate" className="block text-sm font-medium text-neutral-700">
              Target date <span className="text-neutral-500">(optional)</span>
            </label>
            <input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(event) => {
                setTargetDate(event.target.value)
                setTargetDateError(null)
              }}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            />
            {targetDateError && (
              <span className="mt-1 block text-sm text-red-600" role="alert">
                {targetDateError}
              </span>
            )}
          </div>

          {submitError && (
            <span className="block text-sm text-red-600" role="alert">
              {submitError}
            </span>
          )}

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="min-h-[44px] w-full rounded-xl bg-primary-500 px-4 py-3 text-base font-medium text-white transition hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
