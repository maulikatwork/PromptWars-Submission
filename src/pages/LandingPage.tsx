import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <header className="mb-10 animate-fadeInUp">
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-primary-600">
            GenAI Academic Wellness Companion
          </p>
          <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
            A private space to process exam stress
          </h1>
          <p className="mt-4 text-base text-neutral-600">
            Talk through your preparation journey in your own words. This companion listens,
            remembers context, and helps you notice patterns before burnout takes hold.
          </p>
        </header>

        <section className="mb-8 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">What this is</h2>
            <p className="mt-2 text-base text-neutral-600">
              A conversational journaling companion for students preparing for JEE, NEET, CUET,
              CAT, GATE, UPSC, and other high-stakes exams.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">What this is not</h2>
            <p className="mt-2 text-base text-neutral-600">
              This is not a therapist, doctor, or crisis counselor. It cannot diagnose conditions
              or replace professional mental health care.
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-primary-100 bg-primary-50 p-6">
          <h2 className="text-lg font-semibold text-primary-800">Your privacy</h2>
          <p className="mt-2 text-base text-primary-700">
            No account, no email, no password. You get an anonymous ID stored only on this device.
            Your journal stays linked to that ID — not your real-world identity.
          </p>
        </section>

        <section
          className="mb-10 rounded-2xl border border-accent-300 bg-accent-100 p-6"
          aria-label="Crisis helplines"
        >
          <h2 className="text-lg font-semibold text-neutral-900">Need immediate help?</h2>
          <p className="mt-2 text-base text-neutral-700">
            If you are in distress, please reach out to a trusted person or a verified helpline:
          </p>
          <ul className="mt-4 space-y-2 text-base font-medium text-neutral-900">
            <li>Tele-MANAS: 14416</li>
            <li>KIRAN: 1800-599-0019</li>
          </ul>
        </section>

        <button
          type="button"
          onClick={() => navigate('/journal')}
          className="w-full rounded-xl bg-primary-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
        >
          Get Started
        </button>
      </div>
    </main>
  )
}
