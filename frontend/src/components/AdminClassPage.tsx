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
            <p className="eyebrow">School administration</p>
            <h1>Manage admission classes</h1>
            <p>Create a class, set its capacity, and watch the live seat counts.</p>
          </div>
          <span className="foundation-badge">Admin workspace</span>
        </section>

        <ClassCatalog mode="admin" />
      </main>
    </div>
  )
}
