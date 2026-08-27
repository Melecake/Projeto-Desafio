import { useState } from 'react'
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
          <button className="btn btn-danger" onClick={onConfirm}>Remover</button>
        </div>
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
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Ex: Ler 3 livros"
          />
        </div>

        <div className="form-group">
          <label>Descrição</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Uma frase sobre esse objetivo..."
            rows={2}
          />
        </div>

        <div className="form-group">
          <label>Quem é esse objetivo?</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="shared">♡ Nosso (compartilhado)</option>
            <option value="person1">{person1}</option>
            <option value="person2">{person2}</option>
          </select>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={save}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

function GoalCard({ goal, person1, person2, onClose, onDelete, onEdit }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const ownerLabel =
    goal.type === 'shared'  ? '♡ Nosso' :
    goal.type === 'person1' ? person1 : person2

  function handleCheck(status) {
    if (goal.status === status) return
    onClose(goal.id, status)
  }

  return (
    <div className="goal-card card">
      {confirmDelete && (
        <ConfirmModal
          message={`Remover o objetivo "${goal.title}"? Essa ação não pode ser desfeita.`}
          onConfirm={() => { setConfirmDelete(false); onDelete(goal.id) }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      <div className="goal-card-header">
        <h3 className="goal-card-title">{goal.title}</h3>
        <span className="goal-owner-tag">{ownerLabel}</span>
      </div>

      {goal.description && (
        <p className="goal-card-desc">{goal.description}</p>
      )}

      <div className="goal-checkboxes">
        <p className="checkboxes-label">Como foi no final do mês?</p>
        <div className="checkboxes-row">
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={goal.status === 'done'}
              onChange={() => handleCheck('done')}
            />
            <span className="checkbox-label achieved">Conseguimos</span>
          </label>
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={goal.status === 'not_achieved'}
              onChange={() => handleCheck('not_achieved')}
            />
            <span className="checkbox-label not-achieved">Não conseguimos</span>
          </label>
        </div>
      </div>

      <div className="goal-card-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(goal)}>
          Editar
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
          Remover
        </button>
      </div>
    </div>
  )
}

function GoalSection({ label, sub, goals, person1, person2, onClose, onDelete, onEdit }) {
  const [collapsed, setCollapsed] = useState(false)

  if (goals.length === 0) return null

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
          {goals.map(g => (
            <GoalCard
              key={g.id}
              goal={g}
              person1={person1}
              person2={person2}
              onClose={onClose}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Goals({ data, reload }) {
  const { goals, settings } = data
  const [modal, setModal]           = useState(false)
  const [editGoal, setEditGoal]     = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')

  const active = goals.filter(g => g.status !== 'done' && g.status !== 'not_achieved')

  function applyFilters(list) {
    return list.filter(g => {
      const typeOk  = typeFilter === 'all' || g.type === typeFilter
      const monthOk = monthFilter === 'all' || g.createdMonth === monthFilter
      return typeOk && monthOk
    })
  }

  async function saveGoal(form, id) {
    if (id) {
      await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
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
      body: JSON.stringify({
        status,
        progress: status === 'done' ? 100 : 0,
        closedMonth: monthNames[now.getMonth()]
      })
    })
    reload()
  }

  async function deleteGoal(id) {
    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    reload()
  }

  const sections = [
    { label: '♡ Nossos objetivos', type: 'shared',  sub: 'O que queremos fazer juntos.' },
    { label: settings.person1,     type: 'person1', sub: 'Objetivos pessoais.' },
    { label: settings.person2,     type: 'person2', sub: 'Objetivos pessoais.' },
  ]

  const visibleSections = typeFilter === 'all'
    ? sections
    : sections.filter(s => s.type === typeFilter)

  const typeOptions = [
    { value: 'all',     label: 'Todos' },
    { value: 'shared',  label: '♡ Nossos' },
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

      <div className="goals-filter-row">
        <div className="filter-group">
          <label className="filter-label">Categoria</label>
          <select
            className="filter-select"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            {typeOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Mês</label>
          <select
            className="filter-select"
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
          >
            <option value="all">Todos os meses</option>
            {MONTHS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
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
        />
      ))}

      {applyFilters(active).length === 0 && (
        <div className="goals-empty">
          <p>Nenhum objetivo encontrado.</p>
          <p className="section-sub" style={{ marginTop: '0.4rem' }}>
            Oi mo te amo
          </p>
        </div>
      )}

      {modal && (
        <GoalFormModal
          person1={settings.person1}
          person2={settings.person2}
          onClose={() => setModal(false)}
          onSave={saveGoal}
        />
      )}

      {editGoal && (
        <GoalFormModal
          goal={editGoal}
          person1={settings.person1}
          person2={settings.person2}
          onClose={() => setEditGoal(null)}
          onSave={saveGoal}
        />
      )}
    </div>
  )
}