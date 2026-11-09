import { Brand } from './Brand'

type DashboardShellProps = {
  studentId: string
  onChangeStudent: () => void
}

export function DashboardShell({
  studentId,
  onChangeStudent,
}: DashboardShellProps) {
  return (
    <div className="dashboard-page">
      <header className="app-header">
        <div className="app-header-inner">
          <Brand compact />

          <div className="student-menu">
            <div className="student-meta">
              <span>Registration number</span>
              <strong>{studentId}</strong>
            </div>
            <button className="text-button" type="button" onClick={onChangeStudent}>
              Change student
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-heading">
          <div>
            <p className="eyebrow">Admission workspace</p>
            <h1>Welcome to your portal</h1>
            <p>Your registration number is saved on this device.</p>
          </div>
          <span className="foundation-badge">Identity ready</span>
        </section>

        <section className="dashboard-grid" aria-label="Portal preview">
          <article className="preview-card wide">
            <div className="card-topline">
              <p className="card-kicker">Available classes</p>
              <span className="card-status">Next milestone</span>
            </div>
            <div className="empty-state">
              <div>
                <span className="empty-state-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 5.5h14v13H5v-13Zm3 0V4m8 1.5V4M8 10h8m-8 4h5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h2>Class listing comes next</h2>
                <p>
                  The next frontend milestone will connect this area to live seat
                  availability and the application action.
                </p>
              </div>
            </div>
          </article>

          <article className="preview-card">
            <span className="small-card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 4.75h8l3 3v11.5H7V4.75Zm8 0v3h3M10 12h5m-5 3h5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <h2>My applications</h2>
            <p>Application status and remaining hold time will appear here.</p>
          </article>

          <article className="preview-card">
            <span className="small-card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3.75a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Zm0 4v4.75l3 1.75"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <h2>Easy to customize</h2>
            <ul className="edit-guide">
              <li>
                Colors: <code>index.css</code>
              </li>
              <li>
                Layout: <code>App.css</code>
              </li>
              <li>
                Sections: <code>components/</code>
              </li>
            </ul>
          </article>
        </section>
      </main>
    </div>
  )
}
