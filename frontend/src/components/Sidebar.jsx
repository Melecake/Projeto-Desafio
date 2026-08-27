export default function Sidebar({ page, setPage }) {
  const links = [
    { id: 'home',        label: 'Início' },
    { id: 'goals',       label: 'Objetivos' },
    { id: 'months',      label: 'Nossos Meses' },
    { id: 'discoveries', label: 'Descobertas' },
    { id: 'history',     label: 'Histórico' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Momorecos Challenge ♡</div>
      <div className="sidebar-period">João & Marianna</div>

      <nav className="sidebar-links">
        {links.map(l => (
          <button
            key={l.id}
            className={`nav-btn ${page === l.id ? 'active' : ''}`}
            onClick={() => setPage(l.id)}
          >
            {l.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}