export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div
      className="portal-skeleton"
      aria-busy="true"
      aria-label="Đang tải dữ liệu"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  )
}
