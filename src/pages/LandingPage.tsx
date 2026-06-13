import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <header className="mb-8 animate-fadeInUp">
          <h1 className="text-2xl font-semibold text-neutral-800">Antarman</h1>
          <p className="mt-2 text-lg font-normal text-neutral-600">
            A private space to process exam stress
          </p>
        </header>

        <section aria-label="About Antarman" className="mb-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">What this is</h2>
            <p className="mt-2 text-base leading-relaxed text-neutral-700">
              A conversational journaling companion for students preparing for JEE, NEET, CUET,
              CAT, GATE, UPSC, and other high-stakes exams.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">What this is not</h2>
            <p className="mt-2 text-base leading-relaxed text-neutral-700">
              This is not a therapist, doctor, or crisis counselor. It cannot diagnose conditions
              or replace professional mental health care.
            </p>
          </div>
        </section>

        <section
          aria-label="Privacy"
          className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-4"
        >
          <h2 className="text-lg font-semibold text-neutral-800">Your privacy</h2>
          <p className="mt-2 text-base leading-relaxed text-neutral-700">
            No account, no email, no password. You get an anonymous ID stored only on this device.
            Your journal stays linked to that ID — not your real-world identity.
          </p>
        </section>

        <section
          aria-label="Crisis Resources"
          className="mb-8 rounded-xl border border-primary-200 bg-primary-50 p-4"
        >
          <h2 className="text-lg font-semibold text-neutral-800">Need immediate help?</h2>
          <p className="mt-2 text-base leading-relaxed text-neutral-700">
            If you are in distress, please reach out to a trusted person or a verified helpline:
          </p>
          <ul className="mt-3 space-y-1 text-base font-medium text-neutral-800">
            <li>Tele-MANAS: 14416</li>
            <li>KIRAN: 1800-599-0019</li>
          </ul>
        </section>

        <button
          type="button"
          onClick={() => navigate('/journal')}
          className="min-h-[44px] rounded-xl bg-primary-500 px-6 py-3 font-medium text-white transition hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          Get Started →
        </button>
      </div>
    </main>
  )
}
