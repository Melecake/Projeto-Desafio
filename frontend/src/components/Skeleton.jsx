import '../styles/skeleton.css'

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-line w60" />
      <div className="skeleton-line w90" />
      <div className="skeleton-line w40" />
    </div>
  )
}

export function SkeletonPage() {
  return (
    <div className="skeleton-page">
      <div className="skeleton-title" />
      <div className="skeleton-grid">
        {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}