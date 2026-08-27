import { useState } from 'react'
import '../styles/discoveries.css'

const CATEGORIES = [
  { id: 'filmes',   label: 'Filmes',   doneLabel: 'Assistimos',  actionLabel: 'Marcar como assistido' },
  { id: 'series',   label: 'Séries',   doneLabel: 'Assistimos',  actionLabel: 'Marcar como assistida' },
  { id: 'receitas', label: 'Receitas', doneLabel: 'Fizemos',     actionLabel: 'Marcar como feita'     },
  { id: 'livros',   label: 'Livros',   doneLabel: 'Lemos',       actionLabel: 'Marcar como lido'      },
  { id: 'jogos',    label: 'Jogos',    doneLabel: 'Jogamos',     actionLabel: 'Marcar como jogado'    },
]

function formatDate(str) {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(null)
  const display = hovered ?? value ?? 0

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          className={`star-btn ${n <= display ? 'filled' : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          type="button"
        >
          ★
        </button>
      ))}
    </div>
  )
}

function ReviewModal({ item, onClose, onSave }) {
  const [rating, setRating] = useState(item.rating || null)
  const [review, setReview] = useState(item.review || '')

  async function save() {
    await onSave(item.id, { done: true, rating, review })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">Como foi?</h2>
        <p className="discovery-modal-name">"{item.title}"</p>

        <div className="form-group">
          <label>Nota</label>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div className="form-group">
          <label>Review</label>
          <textarea
            value={review}
            onChange={e => setReview(e.target.value)}
            placeholder="O que acharam?"
            rows={3}
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

function ItemFormModal({ category, onClose, onSave }) {
  const [form, setForm] = useState({ title: '', description: '' })
  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function save() {
    if (!form.title.trim()) return
    await onSave({ ...form, category })
    onClose()
  }

  const cat = CATEGORIES.find(c => c.id === category)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">Adicionar em {cat.label}</h2>

        <div className="form-group">
          <label>Nome</label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder={`Nome...`}
          />
        </div>

        <div className="form-group">
          <label>Descrição</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Uma frase sobre esse item..."
            rows={2}
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

function DiscoveryCard({ item, cat, onMarkDone, onDelete, onUndone }) {
  const [reviewModal, setReviewModal] = useState(false)

  return (
    <div className="discovery-card card">
      {reviewModal && (
        <ReviewModal
          item={item}
          onClose={() => setReviewModal(false)}
          onSave={onMarkDone}
        />
      )}

      <div className="discovery-card-header">
        <h3 className="discovery-card-title">{item.title}</h3>
        <button className="discovery-del" onClick={() => onDelete(item.id)}>×</button>
      </div>

      {item.description && (
        <p className="discovery-card-desc">{item.description}</p>
      )}

      <p className="discovery-card-date">Adicionado em {formatDate(item.createdAt)}</p>

      {item.done ? (
        <div className="discovery-done-info">
          {item.rating && (
            <div className="discovery-stars">
              {[1,2,3,4,5].map(n => (
                <span key={n} className={`star-display ${n <= item.rating ? 'filled' : ''}`}>★</span>
              ))}
            </div>
          )}
          {item.review && (
            <p className="discovery-review">"{item.review}"</p>
          )}
          <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => onUndone(item.id)}>
            Desfazer
          </button>
        </div>
      ) : (
        <button
          className="btn btn-ghost btn-sm discovery-action-btn"
          onClick={() => setReviewModal(true)}
        >
          {cat.actionLabel}
        </button>
      )}
    </div>
  )
}

function CategorySection({ cat, items, onAdd, onMarkDone, onDelete, onUndone }) {
  const [collapsed, setCollapsed] = useState(false)
  const [addModal, setAddModal]   = useState(false)

  const pending = items.filter(i => !i.done)
  const done    = items.filter(i => i.done)

  return (
    <div className="discovery-section">
      {addModal && (
        <ItemFormModal
          category={cat.id}
          onClose={() => setAddModal(false)}
          onSave={onAdd}
        />
      )}

      <div className="discovery-section-header">
        <button className="discovery-section-toggle" onClick={() => setCollapsed(c => !c)}>
          <span className="discovery-section-title">{cat.label}</span>
          <span className="section-chevron">{collapsed ? '▼' : '▲'}</span>
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => setAddModal(true)}>+ Adicionar</button>
      </div>

      {!collapsed && (
        <div className="discovery-section-body">
          {pending.length > 0 && (
            <div className="discovery-list">
              {pending.map(item => (
                <DiscoveryCard
                  key={item.id}
                  item={item}
                  cat={cat}
                  onMarkDone={onMarkDone}
                  onDelete={onDelete}
                  onUndone={onUndone}
                />
              ))}
            </div>
          )}

          {done.length > 0 && (
            <div className="discovery-done-section">
              <p className="discovery-done-label">{cat.doneLabel}</p>
              <div className="discovery-list">
                {done.map(item => (
                  <DiscoveryCard
                    key={item.id}
                    item={item}
                    cat={cat}
                    onMarkDone={onMarkDone}
                    onDelete={onDelete}
                    onUndone={onUndone}
                  />
                ))}
              </div>
            </div>
          )}

          {items.length === 0 && (
            <p className="discovery-empty">Nenhum item ainda. Adicione o primeiro.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function Discoveries({ data, reload }) {
  const discoveries = data.discoveries || []

  async function addItem(form) {
    await fetch('/api/discoveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    reload()
  }

  async function markDone(id, body) {
    await fetch(`/api/discoveries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    reload()
  }

  async function markUndone(id) {
    await fetch(`/api/discoveries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: false, rating: null, review: '' })
    })
    reload()
  }

  async function deleteItem(id) {
    await fetch(`/api/discoveries/${id}`, { method: 'DELETE' })
    reload()
  }

  return (
    <div className="discoveries-page">
      <div className="section-header">
        <div>
          <h1 className="section-title">Descobertas</h1>
          <p className="section-sub">Filmes, séries, receitas, livros e jogos que queremos explorar.</p>
        </div>
      </div>

      {CATEGORIES.map(cat => (
        <CategorySection
          key={cat.id}
          cat={cat}
          items={discoveries.filter(d => d.category === cat.id)}
          onAdd={addItem}
          onMarkDone={markDone}
          onDelete={deleteItem}
          onUndone={markUndone}
        />
      ))}
    </div>
  )
}