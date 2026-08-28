import { useState } from 'react'
import { useToast } from '../components/Toast'
import '../styles/goals.css'

const MONTHS = ['Setembro', 'Outubro', 'Novembro', 'Dezembro']

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 360 }}>
        <h2 className="modal-title">Confirmar</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-soft)', marginBottom: '1.25rem' }}>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')

  function addTag() {
    const tag = input.trim().toLowerCase()
    if (!tag || tags.includes(tag)) return
    onChange([...tags, tag])
    setInput('')
  }

  function removeTag(t) { onChange(tags.filter(x => x !== t)) }

  return (
    <div className="tag-input-wrap">
      <div className="tags-list">
        {tags.map(t => (
          <span key={t} className="tag-chip">
            {t}
            <button className="tag-remove" onClick={() => removeTag(t)}>×</button>
          </span>
        ))}
      </div>
      <div className="tag-input-row">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder="Adicionar tag..."
        />
        <button className="btn btn-ghost btn-sm" onClick={addTag}>+</button>
      </div>
    </div>
  )
}

function GoalFormModal({ goal, onClose, onSave, person1, person2 }) {
  const isNew = !goal
  const [form, setForm] = useState({
    title:       goal?.title       || '',
    description: goal?.description || '',
    type:        goal?.type        || 'shared',
    tags:        goal?.tags        || [],
  })

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function save() {
    if (!form.title.trim()) return
    await onSave(form, goal?.id)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{isNew ? 'Novo objetivo' : 'Editar objetivo'}</h2>

        <div className="form-group">
          <label>Título</label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Ler 3 livros" autoFocus />
        </div>

        <div className="form-group">
          <label>Descrição</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Uma frase sobre esse objetivo..." rows={2} />
        </div>

        <div className="form-group">
          <label>Quem é esse objetivo?</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="shared">Nosso (compartilhado)</option>
            <option value="person1">{person1}</option>
            <option value="person2">{person2}</option>
          </select>
        </div>

        <div className="form-group">
          <label>Tags</label>
          <TagInput tags={form.tags} onChange={t => set('tags', t)} />
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={save}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

function GoalCard({ goal, person1, person2, onClose, onDelete, onEdit, onToggleFav }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmClose, setConfirmClose]   = useState(null)

  const ownerLabel =
    goal.type === 'shared'  ? 'Nosso' :
    goal.type === 'person1' ? person1 : person2

  return (
    <div className="goal-card card">
      {confirmDelete && (
        <ConfirmModal
          message={`Remover o objetivo "${goal.title}"?`}
          onConfirm={() => { setConfirmDelete(false); onDelete(goal.id) }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {confirmClose && (
        <ConfirmModal
          message={confirmClose === 'done'
            ? `Marcar "${goal.title}" como conseguido?`
            : `Marcar "${goal.title}" como não conseguido?`}
          onConfirm={() => { onClose(goal.id, confirmClose); setConfirmClose(null) }}
          onCancel={() => setConfirmClose(null)}
        />
      )}

      <div className="goal-card-header">
        <h3 className="goal-card-title">{goal.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            className={`fav-btn ${goal.favorited ? 'active' : ''}`}
            onClick={() => onToggleFav(goal.id, !goal.favorited)}
            title="Favoritar"
          >★</button>
          <span className="goal-owner-tag">{ownerLabel}</span>
        </div>
      </div>

      {goal.description && <p className="goal-card-desc">{goal.description}</p>}

      {goal.tags && goal.tags.length > 0 && (
        <div className="goal-tags">
          {goal.tags.map(t => <span key={t} className="tag-chip readonly">{t}</span>)}
        </div>
      )}

      <div className="goal-checkboxes">
        <p className="checkboxes-label">Como foi no final do mês?</p>
        <div className="checkboxes-row">
          <label className="checkbox-item">
            <input type="checkbox" checked={goal.status === 'done'} onChange={() => setConfirmClose('done')} />
            <span className="checkbox-label achieved">Conseguimos</span>
          </label>
          <label className="checkbox-item">
            <input type="checkbox" checked={goal.status === 'not_achieved'} onChange={() => setConfirmClose('not_achieved')} />
            <span className="checkbox-label not-achieved">Não conseguimos</span>
          </label>
        </div>
      </div>

      <div className="goal-card-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(goal)}>Editar</button>
        <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>Remover</button>
      </div>
    </div>
  )
}

function EmptySection({ label }) {
  return (
    <div className="goals-empty-section">
      <p className="goals-empty-icon">·  ·  ·</p>
      <p className="goals-empty-text">Nenhum objetivo em <em>{label}</em> ainda.</p>
    </div>
  )
}

function GoalSection({ label, sub, goals, person1, person2, onClose, onDelete, onEdit, onToggleFav, searchTerm }) {
  const [collapsed, setCollapsed] = useState(false)

  const filtered = searchTerm
    ? goals.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.tags || []).some(t => t.includes(searchTerm.toLowerCase())))
    : goals

  return (
    <div className="goals-section">
      <button className="goals-section-toggle" onClick={() => setCollapsed(c => !c)}>
        <div className="goals-section-toggle-left">
          <h2 className="goals-section-title">{label}</h2>
          {sub && <p className="section-sub">{sub}</p>}
        </div>
        <span className="section-chevron">{collapsed ? '▼' : '▲'}</span>
      </button>

      {!collapsed && (
        <div className="goals-list">
          {filtered.length === 0
            ? <EmptySection label={label} />
            : filtered.map(g => (
              <GoalCard
                key={g.id}
                goal={g}
                person1={person1}
                person2={person2}
                onClose={onClose}
                onDelete={onDelete}
                onEdit={onEdit}
                onToggleFav={onToggleFav}
              />
            ))
          }
        </div>
      )}
    </div>
  )
}

export default function Goals({ data, reload }) {
  const { goals, settings } = data
  const toast = useToast()

  const [modal, setModal]             = useState(false)
  const [editGoal, setEditGoal]       = useState(null)
  const [typeFilter, setTypeFilter]   = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [searchTerm, setSearchTerm]   = useState('')
  const [showFavOnly, setShowFavOnly] = useState(false)

  const active = goals.filter(g => g.status !== 'done' && g.status !== 'not_achieved')

  function applyFilters(list) {
    return list.filter(g => {
      const typeOk  = typeFilter === 'all' || g.type === typeFilter
      const monthOk = monthFilter === 'all' || g.createdMonth === monthFilter
      const favOk   = !showFavOnly || g.favorited
      return typeOk && monthOk && favOk
    })
  }

  async function saveGoal(form, id) {
    if (id) {
      await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      toast('Objetivo atualizado')
    } else {
      const now = new Date()
      const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                          'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          status: 'in_progress',
          progress: 0,
          note: '',
          history: [],
          createdMonth: monthNames[now.getMonth()],
          createdAt: now.toISOString().split('T')[0]
        })
      })
      toast('Objetivo criado')
    }
    reload()
  }

  async function closeGoal(id, status) {
    const now = new Date()
    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                        'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
    await fetch(`/api/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, progress: status === 'done' ? 100 : 0, closedMonth: monthNames[now.getMonth()] })
    })
    toast(status === 'done' ? 'Objetivo concluído' : 'Objetivo encerrado', 'info')
    reload()
  }

  async function deleteGoal(id) {
    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    toast('Objetivo removido', 'error')
    reload()
  }

  async function toggleFav(id, val) {
    await fetch(`/api/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorited: val })
    })
    toast(val ? 'Adicionado aos favoritos' : 'Removido dos favoritos', 'info')
    reload()
  }

  const sections = [
    { label: 'Nossos objetivos', type: 'shared',  sub: 'O que queremos fazer juntos.' },
    { label: settings.person1,  type: 'person1',  sub: 'Objetivos pessoais.' },
    { label: settings.person2,  type: 'person2',  sub: 'Objetivos pessoais.' },
  ]

  const visibleSections = typeFilter === 'all'
    ? sections
    : sections.filter(s => s.type === typeFilter)

  const typeOptions = [
    { value: 'all',     label: 'Todos' },
    { value: 'shared',  label: 'Nossos' },
    { value: 'person1', label: settings.person1 },
    { value: 'person2', label: settings.person2 },
  ]

  return (
    <div className="goals-page">
      <div className="section-header">
        <div>
          <h1 className="section-title">Objetivos</h1>
          <p className="section-sub">O que queremos fazer durante esse período.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Novo</button>
      </div>

      <div className="goals-controls">
        <div className="goals-filter-row">
          <div className="filter-group">
            <label className="filter-label">Categoria</label>
            <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Mês</label>
            <select className="filter-select" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
              <option value="all">Todos os meses</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Filtrar</label>
            <button
              className={`filter-select fav-filter-btn ${showFavOnly ? 'active' : ''}`}
              onClick={() => setShowFavOnly(f => !f)}
              style={{ cursor: 'pointer', textAlign: 'left' }}
            >
              {showFavOnly ? '★ Favoritos' : '☆ Todos'}
            </button>
          </div>
        </div>
        <div className="goals-search">
          <input
            type="text"
            placeholder="Buscar por título ou tag..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && <button className="search-clear" onClick={() => setSearchTerm('')}>×</button>}
        </div>
      </div>

      {visibleSections.map(s => (
        <GoalSection
          key={s.type}
          label={s.label}
          sub={s.sub}
          goals={applyFilters(active.filter(g => g.type === s.type))}
          person1={settings.person1}
          person2={settings.person2}
          onClose={closeGoal}
          onDelete={deleteGoal}
          onEdit={g => setEditGoal(g)}
          onToggleFav={toggleFav}
          searchTerm={searchTerm}
        />
      ))}

      {modal && (
        <GoalFormModal person1={settings.person1} person2={settings.person2}
          onClose={() => setModal(false)} onSave={saveGoal} />
      )}
      {editGoal && (
        <GoalFormModal goal={editGoal} person1={settings.person1} person2={settings.person2}
          onClose={() => setEditGoal(null)} onSave={saveGoal} />
      )}
    </div>
  )
}