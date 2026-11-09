import { Brand } from './Brand'
import { ClassCatalog } from './ClassCatalog'

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
            <a className="text-button nav-link" href="/admin">
              Admin page
            </a>
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
          <span className="foundation-badge">Applications open</span>
        </section>

        <ClassCatalog mode="student" studentId={studentId} />
      </main>
    </div>
  )
}
