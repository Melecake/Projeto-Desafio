import { useState } from 'react'
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

// ── Meia estrela ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(null)
  const display = hovered ?? value ?? 0

  function handleMouseMove(e, n) {
    const rect = e.currentTarget.getBoundingClientRect()
    const half = e.clientX < rect.left + rect.width / 2
    setHovered(half ? n - 0.5 : n)
  }

  function handleClick(e, n) {
    const rect = e.currentTarget.getBoundingClientRect()
    const half = e.clientX < rect.left + rect.width / 2
    onChange(half ? n - 0.5 : n)
  }

  return (
    <div className="star-rating">
      {[1,2,3,4,5].map(n => {
        const full = display >= n
        const half = !full && display >= n - 0.5
        return (
          <button
            key={n}
            type="button"
            className={`star-btn ${full ? 'filled' : half ? 'half' : ''}`}
            onMouseMove={e => handleMouseMove(e, n)}
            onMouseLeave={() => setHovered(null)}
            onClick={e => handleClick(e, n)}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}

// ── Exibição de estrelas (suporta meia) ───────────────────────────────────────
function StarDisplay({ value }) {
  if (!value) return null
  return (
    <div className="discovery-stars">
      {[1,2,3,4,5].map(n => {
        const full = value >= n
        const half = !full && value >= n - 0.5
        return (
          <span key={n} className={`star-display ${full ? 'filled' : half ? 'half' : ''}`}>
            {half ? '½' : '★'}
          </span>
        )
      })}
      <span className="star-value">{value}</span>
    </div>
  )
}

// ── Modal de detalhes ─────────────────────────────────────────────────────────
function DetailModal({ item, cat, onClose, onMarkDone, onUndone }) {
  const [reviewModal, setReviewModal] = useState(false)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal detail-modal">
        {reviewModal && (
          <ReviewModal item={item} onClose={() => setReviewModal(false)} onSave={onMarkDone} />
        )}

        {item.poster && (
          <div className="detail-poster">
            <img src={item.poster} alt={item.title} />
          </div>
        )}

        <div className="detail-header">
          <h2 className="detail-title">{item.title}</h2>
          <button className="reading-close" onClick={onClose}>×</button>
        </div>

        {item.description && (
          <p className="detail-description">{item.description}</p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="goal-tags" style={{ marginBottom: '0.75rem' }}>
            {item.tags.map(t => <span key={t} className="tag-chip readonly">{t}</span>)}
          </div>
        )}

        <p className="detail-date">Adicionado em {formatDate(item.created_at)}</p>

        {item.done ? (
          <div className="discovery-done-info" style={{ marginTop: '0.75rem' }}>
            <StarDisplay value={item.rating} />
            {item.review && <p className="discovery-review">"{item.review}"</p>}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem' }}
              onClick={() => { onUndone(item.id); onClose() }}>
              Desfazer
            </button>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}
            onClick={() => setReviewModal(true)}>
            {cat.actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Review modal ──────────────────────────────────────────────────────────────
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
          {rating && <p className="rating-value-hint">{rating} estrela{rating !== 1 ? 's' : ''}</p>}
        </div>
        <div className="form-group">
          <label>Review</label>
          <textarea value={review} onChange={e => setReview(e.target.value)}
            placeholder="O que acharam?" rows={3} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={save}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

// ── Item form modal ───────────────────────────────────────────────────────────
function ItemFormModal({ category, item, onClose, onSave }) {
  const isEdit = !!item
  const [form, setForm] = useState({
    title:       item?.title       || '',
    description: item?.description || '',
    tags:        item?.tags        || [],
    category:    item?.category    || category,
    poster:      item?.poster      || '',
  })
  const [tagInput, setTagInput] = useState('')

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (!t || form.tags.includes(t)) return
    set('tags', [...form.tags, t])
    setTagInput('')
  }

  async function save() {
    if (!form.title.trim()) return
    await onSave(form)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{isEdit ? 'Editar' : 'Adicionar'}</h2>

        <div className="form-group">
          <label>Nome</label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="Nome..." autoFocus />
        </div>

        <div className="form-group">
          <label>Descrição</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Uma frase sobre esse item..." rows={2} />
        </div>

        {isEdit && (
          <div className="form-group">
            <label>Categoria</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        )}

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

// ── TMDB search ───────────────────────────────────────────────────────────────
function TmdbSearch({ category, onSelect }) {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    const type = category === 'series' ? 'series' : 'movie'
    const res  = await fetch(`/api/tmdb?query=${encodeURIComponent(query)}&type=${type}`)
    const data = await res.json()
    setResults(data || [])
    setLoading(false)
  }

  if (!open) return (
    <button className="tmdb-lupa-btn" onClick={() => setOpen(true)} title="Buscar no TMDB">
      🔍
    </button>
  )

  return (
    <div className="tmdb-search">
      <div className="tmdb-search-row">
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()} autoFocus
          placeholder={`Buscar ${category === 'series' ? 'série' : 'filme'}...`} />
        <button className="btn btn-ghost btn-sm" onClick={search} disabled={loading}>
          {loading ? '...' : 'Buscar'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); setResults([]) }}>✕</button>
      </div>
      {results.length > 0 && (
        <div className="tmdb-results">
          {results.map(r => (
            <button key={r.id} className="tmdb-result"
              onClick={() => { onSelect(r); setResults([]); setOpen(false) }}>
              {r.poster && <img src={r.poster} alt="" className="tmdb-poster" />}
              <div className="tmdb-info">
                <span className="tmdb-title">{r.title}</span>
                {r.year && <span className="tmdb-year">{r.year}</span>}
                {r.rating && <span className="tmdb-rating">★ {r.rating}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Add simples (receitas, livros, jogos) ─────────────────────────────────────
function AddSimple({ cat, onSave, onClose }) {
  const [form, setForm] = useState({ title: '', description: '', tags: [] })
  const [tagInput, setTagInput] = useState('')
  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (!t || form.tags.includes(t)) return
    set('tags', [...form.tags, t])
    setTagInput('')
  }

  return (
    <>
      <div className="form-group">
        <label>Nome</label>
        <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="Nome..." autoFocus />
      </div>
      <div className="form-group">
        <label>Descrição</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Uma frase sobre esse item..." rows={2} />
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
        <button className="btn btn-primary" onClick={() => form.title.trim() && onSave(form)}>Salvar</button>
      </div>
    </>
  )
}

// ── Add com TMDB (filmes e séries) ────────────────────────────────────────────
function AddWithTmdb({ cat, onSave, onClose }) {
  const [form, setForm] = useState({ title: '', description: '', tags: [], poster: '' })
  const [tagInput, setTagInput] = useState('')
  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (!t || form.tags.includes(t)) return
    set('tags', [...form.tags, t])
    setTagInput('')
  }

  function handleTmdbSelect(result) {
    set('title', result.title)
    set('description', result.overview?.slice(0, 200) || '')
    set('poster', result.poster || '')
  }

  return (
    <>
      <div className="form-group tmdb-row">
        <label>Buscar no TMDB</label>
        <TmdbSearch category={cat.id} onSelect={handleTmdbSelect} />
      </div>

      {form.poster && (
        <div className="form-poster-preview">
          <img src={form.poster} alt="" />
        </div>
      )}

      <div className="form-group">
        <label>Nome</label>
        <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="Nome..." />
      </div>
      <div className="form-group">
        <label>Descrição</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Uma frase sobre esse item..." rows={2} />
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
        <button className="btn btn-primary" onClick={() => form.title.trim() && onSave(form)}>Salvar</button>
      </div>
    </>
  )
}

// ── Discovery card ────────────────────────────────────────────────────────────
function DiscoveryCard({ item, cat, onMarkDone, onDelete, onUndone, onEdit, onToggleFav }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const hasPoster  = !!item.poster
  const descLimit  = 80

  return (
    <div className="discovery-card card">
      {detailOpen && (
        <DetailModal
          item={item}
          cat={cat}
          onClose={() => setDetailOpen(false)}
          onMarkDone={onMarkDone}
          onUndone={onUndone}
        />
      )}

      {/* Poster — filmes e séries */}
      {hasPoster && (
        <div className="discovery-card-poster" onClick={() => setDetailOpen(true)}>
          <img src={item.poster} alt={item.title} />
          {item.done && (
            <div className="discovery-card-poster-badge">✓</div>
          )}
        </div>
      )}

      <div className="discovery-card-body">
        <div className="discovery-card-header">
          <h3
            className="discovery-card-title"
            onClick={() => setDetailOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            {item.title}
          </h3>
          <div className="discovery-card-actions">
            <button
              className={`fav-btn ${item.favorited ? 'active' : ''}`}
              onClick={() => onToggleFav(item.id, !item.favorited)}
            >★</button>
            {!item.done && (
              <button className="discovery-edit" onClick={() => onEdit(item)}>✎</button>
            )}
            <button className="discovery-del" onClick={() => onDelete(item.id)}>×</button>
          </div>
        </div>

        {/* Descrição só aparece se não tiver poster */}
        {!hasPoster && item.description && (
          <p className="discovery-card-desc">
            {item.description.length > descLimit
              ? <>
                  {item.description.slice(0, descLimit)}…{' '}
                  <button className="desc-more" onClick={() => setDetailOpen(true)}>ver mais</button>
                </>
              : item.description
            }
          </p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="goal-tags">
            {item.tags.map(t => (
              <span key={t} className="tag-chip readonly">{t}</span>
            ))}
          </div>
        )}

        <p className="discovery-card-date">Adicionado em {formatDate(item.created_at)}</p>

        {item.done ? (
          <div className="discovery-done-info">
            <StarDisplay value={item.rating} />
            {item.review && (
              <p className="discovery-review">
                {item.review.length > 80
                  ? <>
                      {item.review.slice(0, 80)}…{' '}
                      <button className="desc-more" onClick={() => setDetailOpen(true)}>ver mais</button>
                    </>
                  : `"${item.review}"`
                }
              </p>
            )}
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: '0.5rem' }}
              onClick={() => onUndone(item.id)}
            >
              Desfazer
            </button>
          </div>
        ) : (
          <button
            className="btn btn-ghost btn-sm discovery-action-btn"
            onClick={() => setDetailOpen(true)}
          >
            {cat.actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Category section ──────────────────────────────────────────────────────────
function CategorySection({ cat, items, onAdd, onEdit, onMarkDone, onDelete, onUndone, onToggleFav }) {
  const [collapsed, setCollapsed]       = useState(true)
  const [addModal, setAddModal]         = useState(false)
  const [editItem, setEditItem]         = useState(null)
  const [sort, setSort]                 = useState('date_desc')
  const [search, setSearch]             = useState('')
  const [showControls, setShowControls] = useState(false) // lupa

  const pending  = items.filter(i => !i.done)
  const done     = items.filter(i => i.done)
  const avg      = avgRating(items)
  const showTmdb = cat.id === 'filmes' || cat.id === 'series'

  const filterAndSort = list => sortItems(
    search
      ? list.filter(i =>
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          (i.tags || []).some(t => t.includes(search.toLowerCase()))
        )
      : list,
    sort
  )

  return (
    <div className="discovery-section">
      {addModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAddModal(false)}>
          <div className="modal">
            <h2 className="modal-title">Adicionar em {cat.label}</h2>
            {showTmdb
              ? <AddWithTmdb
                  cat={cat}
                  onSave={form => { onAdd({ ...form, category: cat.id }); setAddModal(false) }}
                  onClose={() => setAddModal(false)}
                />
              : <AddSimple
                  cat={cat}
                  onSave={form => { onAdd({ ...form, category: cat.id }); setAddModal(false) }}
                  onClose={() => setAddModal(false)}
                />
            }
          </div>
        </div>
      )}

      {editItem && (
        <ItemFormModal
          category={cat.id}
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={form => { onEdit(form, editItem.id); setEditItem(null) }}
        />
      )}

      {/* Cabeçalho da seção */}
      <div className="discovery-section-header">
        <button className="discovery-section-toggle" onClick={() => setCollapsed(c => !c)}>
          <span className="discovery-section-title">{cat.label}</span>
          {items.length > 0 && (
            <span className="discovery-section-count">
              {items.length} item{items.length > 1 ? 's' : ''}
            </span>
          )}
          {avg && <span className="discovery-avg">· média {avg}★</span>}
          <span className="section-chevron">{collapsed ? '▼' : '▲'}</span>
        </button>

        <div className="discovery-section-actions">
          {/* Lupa — só aparece quando tem itens e a seção está aberta */}
          {!collapsed && items.length > 0 && (
            <button
              className={`tmdb-lupa-btn ${showControls ? 'active' : ''}`}
              onClick={() => { setShowControls(c => !c); setSearch('') }}
              title="Buscar e filtrar"
            >
              🔍
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setAddModal(true)}>
            + Adicionar
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="discovery-section-body">

          {/* Controles de busca — visíveis só quando lupa ativa */}
          {showControls && items.length > 0 && (
            <div className="discovery-controls">
              <input
                type="text"
                className="search-input discovery-search-input"
                placeholder={`Buscar em ${cat.label}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="search-clear-inline" onClick={() => setSearch('')}>×</button>
              )}
              <select
                className="filter-select discovery-filter-select"
                value={sort}
                onChange={e => setSort(e.target.value)}
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}

          {filterAndSort(pending).length > 0 && (
            <div className="discovery-list">
              {filterAndSort(pending).map(item => (
                <DiscoveryCard
                  key={item.id}
                  item={item}
                  cat={cat}
                  onMarkDone={onMarkDone}
                  onDelete={onDelete}
                  onUndone={onUndone}
                  onEdit={i => setEditItem(i)}
                  onToggleFav={onToggleFav}
                />
              ))}
            </div>
          )}

          {filterAndSort(done).length > 0 && (
            <div className="discovery-done-section">
              <p className="discovery-done-label">{cat.doneLabel}</p>
              <div className="discovery-list">
                {filterAndSort(done).map(item => (
                  <DiscoveryCard
                    key={item.id}
                    item={item}
                    cat={cat}
                    onMarkDone={onMarkDone}
                    onDelete={onDelete}
                    onUndone={onUndone}
                    onEdit={i => setEditItem(i)}
                    onToggleFav={onToggleFav}
                  />
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

// ── Export ────────────────────────────────────────────────────────────────────
export default function Discoveries({ data, reload }) {
  const discoveries = data.discoveries || []
  const toast = useToast()

  async function addItem(form) {
    const res = await fetch('/api/discoveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const result = await res.json()
    if (result.id) {
      toast('Item adicionado')
      reload()
    } else {
      toast('Erro ao adicionar', 'error')
      console.error(result)
    }
  }

  async function editItem(form, id) {
    await fetch(`/api/discoveries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    toast('Item atualizado')
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
          onEdit={editItem}
          onMarkDone={markDone}
          onDelete={deleteItem}
          onUndone={markUndone}
          onToggleFav={toggleFav}
        />
      ))}
    </div>
  )
}