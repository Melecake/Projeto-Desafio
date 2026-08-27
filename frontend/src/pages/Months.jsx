import { useState } from 'react'
import { useToast } from '../components/Toast'
import '../styles/months.css'

const MONTH_ORDER = ['setembro','outubro','novembro','dezembro']

function MonthEntry({ month, settings, onSave, isCurrentMonth }) {
  const [open, setOpen]       = useState(isCurrentMonth)
  const [editing, setEditing] = useState(false)
  const toast = useToast()
  const [form, setForm] = useState({
    reflection1: month.reflection1 || '',
    reflection2: month.reflection2 || '',
    newEvent:    '',
    newMoment:   '',
  })

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function saveReflections() {
    await onSave(month.id, { reflection1: form.reflection1, reflection2: form.reflection2 })
    setEditing(false)
    toast('Reflexões salvas')
  }

  async function addEvent() {
    if (!form.newEvent.trim()) return
    await fetch(`/api/months/${month.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: form.newEvent })
    })
    set('newEvent', '')
    onSave(month.id, {})
    toast('Acontecimento adicionado')
  }

  async function deleteEvent(eid) {
    await fetch(`/api/months/${month.id}/events/${eid}`, { method: 'DELETE' })
    onSave(month.id, {})
    toast('Removido', 'error')
  }

  async function addMoment() {
    if (!form.newMoment.trim()) return
    await fetch(`/api/months/${month.id}/moments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: form.newMoment })
    })
    set('newMoment', '')
    onSave(month.id, {})
    toast('Momento especial adicionado')
  }

  async function deleteMoment(mid) {
    await fetch(`/api/months/${month.id}/moments/${mid}`, { method: 'DELETE' })
    onSave(month.id, {})
    toast('Removido', 'error')
  }

  const isEmpty = !month.reflection1 && !month.reflection2 &&
    !month.events.length && !month.specialMoments.length

  return (
    <div className={`month-entry card ${open ? 'open' : ''} ${isCurrentMonth ? 'current-month' : ''}`}>
      <button className="month-header" onClick={() => setOpen(o => !o)}>
        <div className="month-header-left">
          <span className="month-name">{month.label}</span>
          {isCurrentMonth && <span className="month-current-tag">mês atual</span>}
          {isEmpty
            ? <span className="month-status empty">ainda em branco</span>
            : <span className="month-status filled">registrado</span>
          }
        </div>
        <span className="month-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="month-body">
          <div className="month-section">
            <div className="month-section-header">
              <h3 className="month-section-title">Como foi o mês?</h3>
              {!editing && (
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
                  {month.reflection1 || month.reflection2 ? 'Editar' : 'Escrever'}
                </button>
              )}
            </div>

            {editing ? (
              <div>
                <div className="form-group">
                  <label>{settings.person1}</label>
                  <textarea value={form.reflection1} onChange={e => set('reflection1', e.target.value)} placeholder="Como foi esse mês para você?" rows={4} />
                </div>
                <div className="form-group">
                  <label>{settings.person2}</label>
                  <textarea value={form.reflection2} onChange={e => set('reflection2', e.target.value)} placeholder="Como foi esse mês para você?" rows={4} />
                </div>
                <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
                  <button className="btn btn-primary" onClick={saveReflections}>Salvar</button>
                  <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="month-reflections">
                {[
                  { key: 'reflection1', name: settings.person1, text: month.reflection1 },
                  { key: 'reflection2', name: settings.person2, text: month.reflection2 },
                ].map(r => (
                  <div key={r.key} className={`reflection-block ${!r.text ? 'empty-reflection' : ''}`}>
                    <span className="reflection-name">{r.name}</span>
                    <p className={`reflection-text ${!r.text ? 'muted' : ''}`}>
                      {r.text || 'Ainda não escreveu sobre esse mês.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="divider" />

          <div className="month-section">
            <h3 className="month-section-title">O que aconteceu?</h3>
            <p className="section-sub" style={{ marginBottom: '0.75rem' }}>Coisas que aconteceram durante esse mês.</p>
            <div className="month-items-list">
              {month.events.map(e => (
                <div key={e.id} className="month-item">
                  <span className="month-item-bullet">·</span>
                  <span className="month-item-text">{e.text}</span>
                  <button className="month-item-del" onClick={() => deleteEvent(e.id)}>×</button>
                </div>
              ))}
              {month.events.length === 0 && <p className="month-empty-hint">Nenhum acontecimento registrado ainda.</p>}
            </div>
            <div className="month-add-row">
              <input type="text" value={form.newEvent} onChange={e => set('newEvent', e.target.value)} placeholder="Adicionar acontecimento..." onKeyDown={e => e.key === 'Enter' && addEvent()} />
              <button className="btn btn-ghost btn-sm" onClick={addEvent}>Adicionar</button>
            </div>
          </div>

          <hr className="divider" />

          <div className="month-section">
            <h3 className="month-section-title">Momentos especiais</h3>
            <p className="section-sub" style={{ marginBottom: '0.75rem' }}>Coisas que queremos lembrar.</p>
            <div className="month-items-list">
              {month.specialMoments.map(m => (
                <div key={m.id} className="month-item special">
                  <span className="month-item-bullet">*</span>
                  <span className="month-item-text">{m.text}</span>
                  <button className="month-item-del" onClick={() => deleteMoment(m.id)}>×</button>
                </div>
              ))}
              {month.specialMoments.length === 0 && <p className="month-empty-hint">Nenhum momento especial registrado ainda.</p>}
            </div>
            <div className="month-add-row">
              <input type="text" value={form.newMoment} onChange={e => set('newMoment', e.target.value)} placeholder="Adicionar momento especial..." onKeyDown={e => e.key === 'Enter' && addMoment()} />
              <button className="btn btn-ghost btn-sm" onClick={addMoment}>Adicionar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Months({ data, reload }) {
  const { months, settings } = data

  const now = new Date()
  const currentMonthName = ['janeiro','fevereiro','março','abril','maio','junho',
    'julho','agosto','setembro','outubro','novembro','dezembro'][now.getMonth()]

  const sorted = [...months].sort(
    (a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month)
  )

  async function saveMonth(id, body) {
    await fetch(`/api/months/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    reload()
  }

  return (
    <div className="months-page">
      <div className="section-header">
        <div>
          <h1 className="section-title">Nossos meses</h1>
          <p className="section-sub">O diário desse período juntos, mesmo à distância.</p>
        </div>
      </div>

      <p className="months-intro">
        No final de cada mês, abrimos esse espaço juntos e registramos como foi.
        Daqui a alguns meses, vamos poder olhar para trás e lembrar.
      </p>

      <div className="months-list">
        {sorted.map(m => (
          <MonthEntry
            key={m.id}
            month={m}
            settings={settings}
            onSave={saveMonth}
            isCurrentMonth={m.month === currentMonthName}
          />
        ))}
      </div>
    </div>
  )
}