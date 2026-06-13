interface SkeletonLoaderProps {
  rows?: number
}

export default function SkeletonLoader({ rows = 4 }: SkeletonLoaderProps) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading dashboard">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-24 animate-shimmer rounded-xl border border-white/40 bg-gradient-to-r from-primary-100/60 via-white/70 to-primary-100/60 bg-[length:200%_100%] backdrop-blur-md"
        />
      ))}
    </div>
  )
}
