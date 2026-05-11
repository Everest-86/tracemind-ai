function formatDate(value) {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function RecentRuns({ items, isLoading, onSelect, selectedId }) {
  return (
    <section
      className="history-panel demo-target demo-target--left"
      data-demo-label="History cue"
      data-demo-tip="This section proves the app supports persistence by saving runs and letting you reload earlier analyses."
    >
      <div className="panel-header">
        <div>
          <div className="eyebrow section-eyebrow">Saved Run History</div>
          <h3>Reload recent analyses from the backend.</h3>
        </div>
        <span className="source-badge source-live">SQLite-backed</span>
      </div>

      <p className="panel-copy">
        This history view makes the demo feel more like a real product by showing persistence, traceability, and
        repeatable output review.
      </p>

      {isLoading ? (
        <div className="loading-rows" aria-hidden="true">
          <span className="loading-line"></span>
          <span className="loading-line"></span>
          <span className="loading-line"></span>
        </div>
      ) : items.length > 0 ? (
        <div className="history-list">
          {items.map((item) => (
            <button
              className={`history-item ${selectedId === item.id ? 'history-item--active' : ''}`}
              key={item.id}
              onClick={() => onSelect(item.id)}
              type="button"
            >
              <div className="history-item__top">
                <strong>{item.requirement_reference}</strong>
                <span>{formatDate(item.created_at)}</span>
              </div>
              <p>{item.requirement_excerpt}</p>
              <span>{item.product_name || 'Saved TraceMind AI analysis'}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="empty-copy">
          No saved backend runs yet. Generate a live package while the backend is running to populate this history.
        </p>
      )}
    </section>
  )
}

export default RecentRuns
