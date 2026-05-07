import { Link } from 'react-router-dom'

function TopNav() {
  return (
    <header className="top-nav">
      <div className="page-shell nav-inner">
        <Link className="brand-lockup" to="/">
          <div className="brand-mark">TM</div>
          <div className="brand-copy">
            <strong>TraceMind AI</strong>
            <span>Workflow automation portfolio demo</span>
          </div>
        </Link>

        <nav className="nav-links" aria-label="Primary">
          <a href="#overview">Overview</a>
          <a href="#generator">Generator</a>
          <a href="#results">Results</a>
        </nav>

        <a className="nav-cta primary" href="#generator">
          Start Review
        </a>
      </div>
    </header>
  )
}

export default TopNav
