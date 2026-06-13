import { Link } from 'react-router-dom'

interface StickyHeaderProps {
  studentName: string
}

export default function StickyHeader({ studentName }: StickyHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b glass-bar px-4">
      <h1 className="bg-gradient-to-br from-primary-700 to-primary-500 bg-clip-text text-lg font-bold text-transparent">
        Antarman
      </h1>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-neutral-600">{studentName}</span>
        <Link
          to="/dashboard"
          aria-label="Go to dashboard"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-primary-600 transition hover:bg-primary-100/70 hover:text-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </Link>
      </div>
    </header>
  )
}
