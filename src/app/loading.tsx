export default function Loading() {
  return (
    <main
      id="main-content"
      className="route-loading"
      aria-busy="true"
      aria-label="Đang tải nội dung"
    >
      <div className="container">
        <span className="loading-line loading-line--short" />
        <span className="loading-line loading-line--title" />
        <span className="loading-line" />
        <div className="loading-grid">
          <span />
          <span />
          <span />
        </div>
      </div>
    </main>
  )
}
