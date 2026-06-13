import type { DistressLevel } from '../types/messages'

interface CrisisBannerProps {
  distressLevel: DistressLevel
  onDismiss?: () => void
}

export default function CrisisBanner({ distressLevel, onDismiss }: CrisisBannerProps) {
  const isDismissible = distressLevel === 2

  return (
    <div
      role="alert"
      className={`border px-4 py-3 ${
        distressLevel === 3
          ? 'border-amber-300 bg-amber-100'
          : 'border-accent-300 bg-accent-100'
      }`}
    >
      <div className="mx-auto flex max-w-2xl items-start justify-between gap-3">
        <p className="text-base text-neutral-800">
          💛 You&apos;re not alone. Tele-MANAS: 14416 · KIRAN: 1800-599-0019 (free, 24/7)
        </p>
        {isDismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="min-h-[44px] min-w-[44px] shrink-0 rounded-lg text-neutral-600 transition hover:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
