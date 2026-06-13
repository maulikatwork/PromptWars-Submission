import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UserProvider } from '../context/UserContext'
import OnboardingModal from './OnboardingModal'

describe('OnboardingModal', () => {
  it('keeps submit disabled when name is empty', () => {
    render(
      <UserProvider>
        <OnboardingModal onComplete={() => undefined} />
      </UserProvider>,
    )

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })
})
