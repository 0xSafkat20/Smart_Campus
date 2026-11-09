import { Brand } from './Brand'
import { ClassCatalog } from './ClassCatalog'

export function AdminClassPage() {
  return (
    <div className="dashboard-page">
      <header className="app-header">
        <div className="app-header-inner">
          <Brand compact />
          <a className="text-button nav-link" href="/">
            Student portal
          </a>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-heading admin-heading">
          <div>
            <h1>Class &amp; seat management</h1>
            <p>Create admission classes and monitor seat allocation.</p>
          </div>
        </section>

        <ClassCatalog mode="admin" />
      </main>
    </div>
  )
}
