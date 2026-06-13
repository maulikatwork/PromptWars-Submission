import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-float rounded-full bg-primary-300/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 animate-float rounded-full bg-accent-300/30 blur-3xl"
        style={{ animationDelay: '4s' }}
      />

      <div className="relative mx-auto w-full max-w-md px-5 py-10">
        <header className="mb-7 animate-fadeInUp">
          {/* Intentional: editorial label style — avoids the generic SaaS status-pill pattern */}
          <div className="mb-5 flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm text-primary-600"
            >
              ✦
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary-600">
              Calm, private journaling
            </span>
          </div>

          <h1 className="bg-gradient-to-br from-primary-700 to-primary-500 bg-clip-text text-5xl font-bold text-transparent">
            Antarman
          </h1>
          <p className="mt-2 text-lg text-neutral-600">
            A private space to process exam stress
          </p>
        </header>

        <div className="glass-card mb-4 animate-fadeInUp p-5" style={{ animationDelay: '0.05s' }}>
          <p className="text-sm leading-relaxed text-neutral-700">
            A journaling companion for JEE, NEET, CUET, CAT, GATE, and UPSC students. Not a
            therapist or crisis counselor — it cannot replace professional mental health care.
          </p>
          <p className="mt-3 flex items-start gap-2 text-sm text-neutral-600">
            <span aria-hidden="true" className="mt-0.5 shrink-0 text-primary-500">🔒</span>
            No account, no email. Anonymous ID stored only on this device.
          </p>
        </div>

        <section
          aria-label="Crisis helplines"
          className="mb-8 animate-fadeInUp px-1"
          style={{ animationDelay: '0.1s' }}
        >
          <p className="text-xs text-neutral-500">
            In distress?{' '}
            <span className="font-semibold text-neutral-700">Tele-MANAS: 14416</span>
            {' · '}
            <span className="font-semibold text-neutral-700">KIRAN: 1800-599-0019</span>
          </p>
        </section>

        <button
          type="button"
          onClick={() => navigate('/journal')}
          className="w-full animate-fadeInUp rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 px-7 py-3 font-semibold text-white shadow-glass transition hover:from-primary-600 hover:to-primary-700 hover:shadow-glass-lg active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 sm:w-auto"
          style={{ animationDelay: '0.15s', minHeight: '44px' }}
        >
          Get Started →
        </button>
      </div>
    </main>
  )
}
