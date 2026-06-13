import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-float rounded-full bg-primary-300/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 animate-float rounded-full bg-accent-300/30 blur-3xl"
        style={{ animationDelay: '4s' }}
      />

      <div className="relative mx-auto max-w-2xl px-4 py-10">
        <header className="mb-10 animate-fadeInUp">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/50 px-3 py-1 text-sm font-medium text-primary-700 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-primary-500" aria-hidden="true" />
            Calm, private journaling
          </span>
          <h1 className="mt-5 bg-gradient-to-br from-primary-700 to-primary-500 bg-clip-text text-4xl font-bold text-transparent">
            Antarman
          </h1>
          <p className="mt-3 text-lg font-normal text-neutral-700">
            A private space to process exam stress
          </p>
        </header>

        <section aria-label="About Antarman" className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="glass-card animate-fadeInUp p-5">
            <h2 className="text-lg font-semibold text-neutral-800">What this is</h2>
            <p className="mt-2 text-base leading-relaxed text-neutral-700">
              A conversational journaling companion for students preparing for JEE, NEET, CUET,
              CAT, GATE, UPSC, and other high-stakes exams.
            </p>
          </div>
          <div className="glass-card animate-fadeInUp p-5">
            <h2 className="text-lg font-semibold text-neutral-800">What this is not</h2>
            <p className="mt-2 text-base leading-relaxed text-neutral-700">
              This is not a therapist, doctor, or crisis counselor. It cannot diagnose conditions
              or replace professional mental health care.
            </p>
          </div>
        </section>

        <section
          aria-label="Privacy"
          className="glass-card mb-6 animate-fadeInUp p-5 ring-1 ring-primary-200/60"
        >
          <h2 className="text-lg font-semibold text-neutral-800">Your privacy</h2>
          <p className="mt-2 text-base leading-relaxed text-neutral-700">
            No account, no email, no password. You get an anonymous ID stored only on this device.
            Your journal stays linked to that ID — not your real-world identity.
          </p>
        </section>

        <section
          aria-label="Crisis Resources"
          className="glass-card mb-10 animate-fadeInUp p-5 ring-1 ring-primary-200/60"
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
          className="min-h-[44px] rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 px-7 py-3 font-semibold text-white shadow-glass transition hover:from-primary-600 hover:to-primary-700 hover:shadow-glass-lg active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          Get Started →
        </button>
      </div>
    </main>
  )
}
