import { useState } from 'react'
import '../styles/months.css'

const MONTH_ORDER = ['setembro','outubro','novembro','dezembro']

function MonthEntry({ month, settings, onSave }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    reflection1: month.reflection1 || '',
    reflection2: month.reflection2 || '',
    newEvent:    '',
    newMoment:   '',
  })

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function saveReflections() {
    await onSave(month.id, {
      reflection1: form.reflection1,
      reflection2: form.reflection2,
    })
    setEditing(false)
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
  }

  async function deleteEvent(eid) {
    await fetch(`/api/months/${month.id}/events/${eid}`, { method: 'DELETE' })
    onSave(month.id, {})
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
  }

  async function deleteMoment(mid) {
    await fetch(`/api/months/${month.id}/moments/${mid}`, { method: 'DELETE' })
    onSave(month.id, {})
  }

  const isEmpty = !month.reflection1 && !month.reflection2 &&
    !month.events.length && !month.specialMoments.length

  return (
    <div className={`month-entry card ${open ? 'open' : ''}`}>
      <button className="month-header" onClick={() => setOpen(o => !o)}>
        <div className="month-header-left">
          <span className="month-name">{month.label}</span>
          {isEmpty
            ? <span className="month-status empty">ainda em branco</span>
            : <span className="month-status filled">registrado ♡</span>
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
                  <textarea
                    value={form.reflection1}
                    onChange={e => set('reflection1', e.target.value)}
                    placeholder="Como foi esse mês para você?"
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label>{settings.person2}</label>
                  <textarea
                    value={form.reflection2}
                    onChange={e => set('reflection2', e.target.value)}
                    placeholder="Como foi esse mês para você?"
                    rows={4}
                  />
                </div>
                <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
                  <button className="btn btn-primary" onClick={saveReflections}>Salvar</button>
                  <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="month-reflections">
                {month.reflection1 ? (
                  <div className="reflection-block">
                    <span className="reflection-name">{settings.person1}</span>
                    <p className="reflection-text">{month.reflection1}</p>
                  </div>
                ) : (
                  <div className="reflection-block empty-reflection">
                    <span className="reflection-name">{settings.person1}</span>
                    <p className="reflection-text muted">Ainda não escreveu sobre esse mês.</p>
                  </div>
                )}
                {month.reflection2 ? (
                  <div className="reflection-block">
                    <span className="reflection-name">{settings.person2}</span>
                    <p className="reflection-text">{month.reflection2}</p>
                  </div>
                ) : (
                  <div className="reflection-block empty-reflection">
                    <span className="reflection-name">{settings.person2}</span>
                    <p className="reflection-text muted">Ainda não escreveu sobre esse mês.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <hr className="divider" />

          <div className="month-section">
            <h3 className="month-section-title">O que aconteceu?</h3>
            <p className="section-sub" style={{ marginBottom: '0.75rem' }}>
              Coisas que aconteceram durante esse mês.
            </p>
            <div className="month-items-list">
              {month.events.map(e => (
                <div key={e.id} className="month-item">
                  <span className="month-item-bullet">·</span>
                  <span className="month-item-text">{e.text}</span>
                  <button className="month-item-del" onClick={() => deleteEvent(e.id)}>×</button>
                </div>
              ))}
            </div>
            <div className="month-add-row">
              <input
                type="text"
                value={form.newEvent}
                onChange={e => set('newEvent', e.target.value)}
                placeholder="Adicionar acontecimento..."
                onKeyDown={e => e.key === 'Enter' && addEvent()}
              />
              <button className="btn btn-ghost btn-sm" onClick={addEvent}>Adicionar</button>
            </div>
          </div>

          <hr className="divider" />

          <div className="month-section">
            <h3 className="month-section-title">Momentos especiais ♡</h3>
            <p className="section-sub" style={{ marginBottom: '0.75rem' }}>
              Coisas que queremos lembrar.
            </p>
            <div className="month-items-list">
              {month.specialMoments.map(m => (
                <div key={m.id} className="month-item special">
                  <span className="month-item-bullet">♡</span>
                  <span className="month-item-text">{m.text}</span>
                  <button className="month-item-del" onClick={() => deleteMoment(m.id)}>×</button>
                </div>
              ))}
            </div>
            <div className="month-add-row">
              <input
                type="text"
                value={form.newMoment}
                onChange={e => set('newMoment', e.target.value)}
                placeholder="Adicionar momento especial..."
                onKeyDown={e => e.key === 'Enter' && addMoment()}
              />
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
          <p className="section-sub">O diário do desafio.</p>
        </div>
      </div>

      <p className="months-intro">
        No final de cada mês, abrimos esse espaço juntos e registramos como foi.
      </p>

      <div className="months-list">
        {sorted.map(m => (
          <MonthEntry
            key={m.id}
            month={m}
            settings={settings}
            onSave={saveMonth}
          />
        ))}
      </div>
    </div>
  )
}