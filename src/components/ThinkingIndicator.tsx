export default function ThinkingIndicator() {
  return (
    <div
      aria-live="polite"
      aria-label="AI is responding"
      className="flex items-center gap-1 self-start rounded-2xl bg-primary-50 px-4 py-3"
    >
      <span
        className="h-2 w-2 animate-bounce rounded-full bg-neutral-300"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="h-2 w-2 animate-bounce rounded-full bg-neutral-300"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="h-2 w-2 animate-bounce rounded-full bg-neutral-300"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  )
}
