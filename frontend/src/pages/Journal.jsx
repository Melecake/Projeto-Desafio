import { useState, useEffect } from 'react'
import { useToast } from '../components/Toast'
import '../styles/journal.css'

function formatDate(str) {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${d} de ${months[parseInt(m) - 1]} de ${y}`
}

function EntryModal({ entry, settings, onClose, onSave }) {
  const isNew = !entry
  const [form, setForm] = useState({
    title:  entry?.title  || '',
    body:   entry?.body   || '',
    author: entry?.author || settings.person1,
  })

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function save() {
    if (!form.title.trim() || !form.body.trim()) return
    await onSave(form, entry?.id)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal journal-modal">
        <h2 className="modal-title">{isNew ? 'Nova anotação' : 'Editar anotação'}</h2>

        <div className="form-group">
          <label>Título</label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Do que se trata essa anotação?"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Quem escreve?</label>
          <select value={form.author} onChange={e => set('author', e.target.value)}>
            <option value={settings.person1}>{settings.person1}</option>
            <option value={settings.person2}>{settings.person2}</option>
            <option value="Nós dois">Nós dois</option>
          </select>
        </div>

        <div className="form-group">
          <label>Anotação</label>
          <textarea
            value={form.body}
            onChange={e => set('body', e.target.value)}
            placeholder="Escreva aqui sua ideia, plano, pensamento..."
            rows={12}
            className="journal-textarea"
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={save}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

function EntryView({ entry, onClose, onEdit, onDelete }) {
  return (
    <div className="journal-view-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="journal-view">
        <div className="journal-view-header">
          <div>
            <h2 className="journal-view-title">{entry.title}</h2>
            <div className="journal-view-meta">
              <span className="journal-view-author">{entry.author}</span>
              <span className="journal-view-sep">·</span>
              <span className="journal-view-date">{formatDate(entry.created_at)}</span>
              {entry.updated_at !== entry.created_at && (
                <>
                  <span className="journal-view-sep">·</span>
                  <span className="journal-view-date">editado em {formatDate(entry.updated_at)}</span>
                </>
              )}
            </div>
          </div>
          <button className="reading-close" onClick={onClose}>×</button>
        </div>

        <div className="journal-view-body">
          <p className="journal-view-text">{entry.body}</p>
        </div>

        <div className="journal-view-actions">
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>Editar</button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}>Remover</button>
        </div>
      </div>
    </div>
  )
}

export default function Journal({ data }) {
  const { settings } = data
  const toast = useToast()

  const [entries, setEntries]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [newModal, setNewModal]   = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [viewEntry, setViewEntry] = useState(null)
  const [search, setSearch]       = useState('')
  const [authorFilter, setAuthorFilter] = useState('all')

  async function loadEntries() {
    setLoading(true)
    const res = await fetch('/api/journal')
    const data = await res.json()
    setEntries(data)
    setLoading(false)
  }

  useEffect(() => { loadEntries() }, [])

  async function saveEntry(form, id) {
    if (id) {
      await fetch(`/api/journal/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      toast('Anotação atualizada')
    } else {
      await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      toast('Anotação criada')
    }
    loadEntries()
  }

  async function deleteEntry(id) {
    await fetch(`/api/journal/${id}`, { method: 'DELETE' })
    toast('Anotação removida', 'error')
    setViewEntry(null)
    loadEntries()
  }

  const authorOptions = [
    { value: 'all',            label: 'Todos' },
    { value: settings.person1, label: settings.person1 },
    { value: settings.person2, label: settings.person2 },
    { value: 'Nós dois',       label: 'Nós dois' },
  ]

  const filtered = entries.filter(e => {
    const searchOk = !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.body.toLowerCase().includes(search.toLowerCase())
    const authorOk = authorFilter === 'all' || e.author === authorFilter
    return searchOk && authorOk
  })

  return (
    <div className="journal-page">

      {newModal && (
        <EntryModal
          settings={settings}
          onClose={() => setNewModal(false)}
          onSave={saveEntry}
        />
      )}

      {editEntry && (
        <EntryModal
          entry={editEntry}
          settings={settings}
          onClose={() => setEditEntry(null)}
          onSave={async (form, id) => {
            await saveEntry(form, id)
            setEditEntry(null)
            setViewEntry(null)
          }}
        />
      )}

      {viewEntry && !editEntry && (
        <EntryView
          entry={viewEntry}
          onClose={() => setViewEntry(null)}
          onEdit={() => setEditEntry(viewEntry)}
          onDelete={() => deleteEntry(viewEntry.id)}
        />
      )}

      <div className="section-header">
        <div>
          <h1 className="section-title">Anotações</h1>
          <p className="section-sub">Ideias, planos e pensamentos de vocês dois.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setNewModal(true)}>+ Nova</button>
      </div>

      <div className="journal-controls">
        <div className="goals-search" style={{ flex: 1, maxWidth: '360px' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar anotação..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
        </div>
        <select
          className="filter-select"
          value={authorFilter}
          onChange={e => setAuthorFilter(e.target.value)}
        >
          {authorOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading && (
        <div className="journal-loading">Carregando anotações...</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="journal-empty">
          <p className="goals-empty-icon">·  ·  ·</p>
          <p className="goals-empty-text">
            {entries.length === 0
              ? 'Nenhuma anotação ainda. Escreva a primeira ideia.'
              : 'Nenhuma anotação encontrada para esse filtro.'
            }
          </p>
        </div>
      )}

      <div className="journal-grid">
        {filtered.map(entry => (
          <button
            key={entry.id}
            className="journal-card card"
            onClick={() => setViewEntry(entry)}
          >
            <div className="journal-card-header">
              <span className="journal-card-author">{entry.author}</span>
              <span className="journal-card-date">{formatDate(entry.created_at)}</span>
            </div>
            <h3 className="journal-card-title">{entry.title}</h3>
            <p className="journal-card-preview">
              {entry.body.slice(0, 140)}{entry.body.length > 140 ? '…' : ''}
            </p>
          </button>
        ))}
      </div>

    </div>
  )
}