interface SkeletonLoaderProps {
  rows?: number
}

export default function SkeletonLoader({ rows = 4 }: SkeletonLoaderProps) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading dashboard">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-24 animate-shimmer rounded-xl bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
        />
      ))}
    </div>
  )
}
