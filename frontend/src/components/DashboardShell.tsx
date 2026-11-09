import { useCallback, useState } from 'react'
import { ApplicationsPanel } from './ApplicationsPanel'
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
  const [syncVersion, setSyncVersion] = useState(0)
  const handleApplicationChanged = useCallback(
    () => setSyncVersion((current) => current + 1),
    [],
  )

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
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-heading">
          <div>
            <h1>Student admission dashboard</h1>
            <p>Review classes, reserve a seat, and track your application.</p>
          </div>
        </section>

        <ClassCatalog
          mode="student"
          studentId={studentId}
          syncVersion={syncVersion}
          onApplicationChanged={handleApplicationChanged}
        />
        <ApplicationsPanel
          studentId={studentId}
          syncVersion={syncVersion}
          onApplicationChanged={handleApplicationChanged}
        />
      </main>
    </div>
  )
}
