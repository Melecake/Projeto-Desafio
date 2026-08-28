import { useState, useRef } from 'react'
import { useToast } from '../components/Toast'
import '../styles/discoveries.css'

const CATEGORIES = [
  { id: 'filmes',   label: 'Filmes',   doneLabel: 'Assistimos',  actionLabel: 'Marcar como assistido' },
  { id: 'series',   label: 'Séries',   doneLabel: 'Assistimos',  actionLabel: 'Marcar como assistida' },
  { id: 'receitas', label: 'Receitas', doneLabel: 'Fizemos',     actionLabel: 'Marcar como feita'     },
  { id: 'livros',   label: 'Livros',   doneLabel: 'Lemos',       actionLabel: 'Marcar como lido'      },
  { id: 'jogos',    label: 'Jogos',    doneLabel: 'Jogamos',     actionLabel: 'Marcar como jogado'    },
]

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Mais recente' },
  { value: 'date_asc',  label: 'Mais antigo'  },
  { value: 'name_asc',  label: 'A → Z'        },
  { value: 'rating',    label: 'Melhor nota'  },
]

function formatDate(str) {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function avgRating(items) {
  const rated = items.filter(i => i.done && i.rating)
  if (!rated.length) return null
  return (rated.reduce((s, i) => s + i.rating, 0) / rated.length).toFixed(1)
}

function sortItems(items, sort) {
  return [...items].sort((a, b) => {
    if (sort === 'date_asc')  return (a.created_at || '').localeCompare(b.created_at || '')
    if (sort === 'date_desc') return (b.created_at || '').localeCompare(a.created_at || '')
    if (sort === 'name_asc')  return a.title.localeCompare(b.title)
    if (sort === 'rating')    return (b.rating || 0) - (a.rating || 0)
    return 0
  })
}

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(null)
  const display = hovered ?? value ?? 0
  return (
    <div className="star-rating">
      {[1,2,3,4,5].map(n => (
        <button key={n} className={`star-btn ${n <= display ? 'filled' : ''}`}
          onClick={() => onChange(n)} onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)} type="button">★</button>
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
          <textarea value={review} onChange={e => setReview(e.target.value)} placeholder="O que acharam?" rows={3} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={save}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

function ItemFormModal({ category, item, onClose, onSave }) {
  const isEdit = !!item
  const [form, setForm] = useState({
    title:       item?.title       || '',
    description: item?.description || '',
    tags:        item?.tags        || [],
    category:    item?.category    || category,
  })
  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }
  const [tagInput, setTagInput] = useState('')

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (!t || form.tags.includes(t)) return
    set('tags', [...form.tags, t])
    setTagInput('')
  }

  async function save() {
    if (!form.title.trim()) return
    await onSave(form, item?.id)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{isEdit ? 'Editar' : `Adicionar`}</h2>

        <div className="form-group">
          <label>Nome</label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Nome..." autoFocus />
        </div>

        <div className="form-group">
          <label>Descrição</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Uma frase sobre esse item..." rows={2} />
        </div>

        <div className="form-group">
          <label>Categoria</label>
          <select value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Tags</label>
          <div className="tags-list" style={{ marginBottom: '0.35rem' }}>
            {form.tags.map(t => (
              <span key={t} className="tag-chip">
                {t}
                <button className="tag-remove" onClick={() => set('tags', form.tags.filter(x => x !== t))}>×</button>
              </span>
            ))}
          </div>
          <div className="tag-input-row">
            <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Adicionar tag..." />
            <button className="btn btn-ghost btn-sm" onClick={addTag}>+</button>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={save}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

function DiscoveryCard({ item, cat, onMarkDone, onDelete, onUndone, onEdit, onToggleFav }) {
  const [reviewModal, setReviewModal] = useState(false)

  return (
    <div className="discovery-card card">
      {reviewModal && (
        <ReviewModal item={item} onClose={() => setReviewModal(false)} onSave={onMarkDone} />
      )}

      <div className="discovery-card-header">
        <h3 className="discovery-card-title">{item.title}</h3>
        <div className="discovery-card-actions">
          <button className={`fav-btn ${item.favorited ? 'active' : ''}`}
            onClick={() => onToggleFav(item.id, !item.favorited)}>★</button>
          {!item.done && <button className="discovery-edit" onClick={() => onEdit(item)}>✎</button>}
          <button className="discovery-del" onClick={() => onDelete(item.id)}>×</button>
        </div>
      </div>

      {item.description && <p className="discovery-card-desc">{item.description}</p>}

      {item.tags && item.tags.length > 0 && (
        <div className="goal-tags">
          {item.tags.map(t => <span key={t} className="tag-chip readonly">{t}</span>)}
        </div>
      )}

      <p className="discovery-card-date">Adicionado em {formatDate(item.created_at)}</p>

      {item.done ? (
        <div className="discovery-done-info">
          {item.rating && (
            <div className="discovery-stars">
              {[1,2,3,4,5].map(n => (
                <span key={n} className={`star-display ${n <= item.rating ? 'filled' : ''}`}>★</span>
              ))}
            </div>
          )}
          {item.review && <p className="discovery-review">"{item.review}"</p>}
          <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => onUndone(item.id)}>
            Desfazer
          </button>
        </div>
      ) : (
        <button className="btn btn-ghost btn-sm discovery-action-btn" onClick={() => setReviewModal(true)}>
          {cat.actionLabel}
        </button>
      )}
    </div>
  )
}

function CategorySection({ cat, items, onAdd, onMarkDone, onDelete, onUndone, onEdit, onToggleFav }) {
  const [collapsed, setCollapsed] = useState(false)
  const [addModal, setAddModal]   = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [sort, setSort]           = useState('date_desc')
  const [search, setSearch]       = useState('')

  const pending = items.filter(i => !i.done)
  const done    = items.filter(i => i.done)
  const avg     = avgRating(items)

  const filterAndSort = list => sortItems(
    search ? list.filter(i =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      (i.tags || []).some(t => t.includes(search.toLowerCase()))
    ) : list,
    sort
  )

  return (
    <div className="discovery-section">
      {addModal && <ItemFormModal category={cat.id} onClose={() => setAddModal(false)} onSave={onAdd} />}
      {editItem && <ItemFormModal category={cat.id} item={editItem} onClose={() => setEditItem(null)} onSave={onEdit} />}

      <div className="discovery-section-header">
        <button className="discovery-section-toggle" onClick={() => setCollapsed(c => !c)}>
          <span className="discovery-section-title">{cat.label}</span>
          {avg && <span className="discovery-avg">média {avg}★</span>}
          <span className="section-chevron">{collapsed ? '▼' : '▲'}</span>
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => setAddModal(true)}>+ Adicionar</button>
      </div>

      {!collapsed && (
        <div className="discovery-section-body">
          {items.length > 0 && (
            <div className="discovery-controls">
              <div className="discovery-search-wrap">
                <input type="text" className="search-input"
                  placeholder={`Buscar em ${cat.label}...`}
                  value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
              </div>
              <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}

          {filterAndSort(pending).length > 0 && (
            <div className="discovery-list">
              {filterAndSort(pending).map(item => (
                <DiscoveryCard key={item.id} item={item} cat={cat}
                  onMarkDone={onMarkDone} onDelete={onDelete} onUndone={onUndone}
                  onEdit={i => setEditItem(i)} onToggleFav={onToggleFav} />
              ))}
            </div>
          )}

          {filterAndSort(done).length > 0 && (
            <div className="discovery-done-section">
              <p className="discovery-done-label">{cat.doneLabel}</p>
              <div className="discovery-list">
                {filterAndSort(done).map(item => (
                  <DiscoveryCard key={item.id} item={item} cat={cat}
                    onMarkDone={onMarkDone} onDelete={onDelete} onUndone={onUndone}
                    onEdit={i => setEditItem(i)} onToggleFav={onToggleFav} />
                ))}
              </div>
            </div>
          )}

          {items.length === 0 && (
            <div className="discovery-empty-state">
              <p className="discovery-empty-icon">· · ·</p>
              <p className="discovery-empty">Nenhum item ainda. Adicione o primeiro.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Discoveries({ data, reload }) {
  const discoveries = data.discoveries || []
  const toast = useToast()

  async function addItem(form, id) {
    if (id) {
      await fetch(`/api/discoveries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      toast('Item atualizado')
    } else {
      await fetch('/api/discoveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      toast('Item adicionado')
    }
    reload()
  }

  async function markDone(id, body) {
    await fetch(`/api/discoveries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    toast('Marcado como concluído')
    reload()
  }

  async function markUndone(id) {
    await fetch(`/api/discoveries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: false, rating: null, review: '' })
    })
    toast('Marcação desfeita', 'info')
    reload()
  }

  async function deleteItem(id) {
    await fetch(`/api/discoveries/${id}`, { method: 'DELETE' })
    toast('Item removido', 'error')
    reload()
  }

  async function toggleFav(id, val) {
    await fetch(`/api/discoveries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorited: val })
    })
    toast(val ? 'Adicionado aos favoritos' : 'Removido dos favoritos', 'info')
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
          onEdit={addItem}
          onToggleFav={toggleFav}
        />
      ))}
    </div>
  )
}