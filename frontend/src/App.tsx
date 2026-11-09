import './App.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

function App() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <p className="eyebrow">School Admission System</p>
        <h1>Project scaffold is ready</h1>
        <p className="lead">
          The required React interface will be built here in small, testable steps.
        </p>
      </header>

      <section className="status-card" aria-labelledby="setup-status">
        <div>
          <p className="section-label">Setup status</p>
          <h2 id="setup-status">Frontend connected to configuration</h2>
          <p>
            API base URL: <code>{apiBaseUrl}</code>
          </p>
        </div>
        <span className="status-badge">Scaffold only</span>
      </section>

      <section className="next-step" aria-labelledby="next-step-title">
        <p className="section-label">Next implementation step</p>
        <h2 id="next-step-title">Build the database model and fixed API contract</h2>
        <p>
          Admission actions, timers, class lists, and payment confirmation are not
          implemented yet.
        </p>
      </section>
    </main>
  )
}

export default App
