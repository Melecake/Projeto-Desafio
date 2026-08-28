import { useState, useEffect, useRef } from 'react'
import { useToast } from '../components/Toast'
import ImageUpload from '../components/ImageUpload'
import '../styles/home.css'

function PhotoCarousel() {
  const [photos, setPhotos]       = useState([])
  const [current, setCurrent]     = useState(0)
  const [animating, setAnimating] = useState(false)
  const [managing, setManaging]   = useState(false)
  const timerRef = useRef(null)
  const toast    = useToast()

  async function loadPhotos() {
    const res  = await fetch('/api/photos')
    const data = await res.json()
    if (Array.isArray(data) && data.length) setPhotos(data)
  }

  useEffect(() => { loadPhotos() }, [])

  function startTimer(list) {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      goTo(idx => (idx + 1) % list.length)
    }, 10000)
  }

  useEffect(() => {
    if (photos.length < 2) return
    startTimer(photos)
    return () => clearInterval(timerRef.current)
  }, [photos])

  function goTo(getNext) {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setCurrent(c => typeof getNext === 'function' ? getNext(c) : getNext)
      setAnimating(false)
    }, 400)
  }

  function go(idx) {
    clearInterval(timerRef.current)
    goTo(idx)
    if (photos.length >= 2) startTimer(photos)
  }

  async function handleUpload(url, name) {
    const res  = await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, name })
    })
    const data = await res.json()
    setPhotos(p => [...p, data])
    toast('Foto adicionada ao carrossel')
  }

  async function handleDelete(id) {
    await fetch(`/api/photos/${id}`, { method: 'DELETE' })
    const updated = photos.filter(p => p.id !== id)
    setPhotos(updated)
    if (current >= updated.length) setCurrent(Math.max(0, updated.length - 1))
    toast('Foto removida', 'error')
  }

  if (photos.length === 0 && !managing) return (
    <div className="carousel-empty">
      <p className="carousel-empty-text">Nenhuma foto no carrossel ainda.</p>
      <ImageUpload bucket="photos" label="Adicionar primeira foto" onUpload={handleUpload} />
    </div>
  )

  const total    = photos.length
  const prevIdx  = (current - 1 + total) % total
  const nextIdx  = (current + 1) % total
  const showSide = total >= 3

  return (
    <div className="carousel">
      {!managing ? (
        <>
          <div className={`carousel-stage ${animating ? 'animating' : ''}`}>
            {showSide && (
              <div className="carousel-side" onClick={() => go(prevIdx)}>
                <img src={photos[prevIdx].url} alt="" className="carousel-side-img" />
                <div className="carousel-side-overlay" />
              </div>
            )}
            <div className="carousel-main">
              <img src={photos[current].url} alt="" className="carousel-main-img" />
              <button className="carousel-btn prev" onClick={() => go(prevIdx)}>‹</button>
              <button className="carousel-btn next" onClick={() => go(nextIdx)}>›</button>
            </div>
            {showSide && (
              <div className="carousel-side" onClick={() => go(nextIdx)}>
                <img src={photos[nextIdx].url} alt="" className="carousel-side-img" />
                <div className="carousel-side-overlay" />
              </div>
            )}
          </div>
          <div className="carousel-footer">
            <div className="carousel-dots">
              {photos.map((_, i) => (
                <button key={i} className={`carousel-dot ${i === current ? 'active' : ''}`} onClick={() => go(i)} />
              ))}
            </div>
            <button className="carousel-manage-btn" onClick={() => setManaging(true)}>Gerenciar fotos</button>
          </div>
        </>
      ) : (
        <div className="carousel-manager">
          <div className="carousel-manager-header">
            <h3 className="carousel-manager-title">Gerenciar fotos</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setManaging(false)}>Fechar</button>
          </div>
          <div className="carousel-manager-grid">
            {photos.map(p => (
              <div key={p.id} className="carousel-manager-item">
                <img src={p.url} alt="" />
                <button className="carousel-manager-del" onClick={() => handleDelete(p.id)}>×</button>
              </div>
            ))}
          </div>
          <ImageUpload bucket="photos" label="Adicionar foto" onUpload={handleUpload} />
        </div>
      )}
    </div>
  )
}

function MiniCalendar({ settings }) {
  const [events, setEvents]   = useState([])
  const [current, setCurrent] = useState(new Date())
  const [form, setForm]       = useState({ title: '', date: '', color: 'default', author: settings.person1 })
  const [adding, setAdding]   = useState(false)
  const toast = useToast()

  async function loadEvents() {
    const res  = await fetch('/api/calendar')
    const data = await res.json()
    setEvents(data || [])
  }

  useEffect(() => { loadEvents() }, [])

  async function addEvent() {
    if (!form.title.trim() || !form.date) return
    await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    toast('Evento adicionado')
    setForm({ title: '', date: '', color: 'default', author: settings.person1 })
    setAdding(false)
    loadEvents()
  }

  async function deleteEvent(id) {
    await fetch(`/api/calendar/${id}`, { method: 'DELETE' })
    toast('Evento removido', 'error')
    loadEvents()
  }

  const year  = current.getFullYear()
  const month = current.getMonth()

  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const dayNames   = ['D','S','T','Q','Q','S','S']

  const firstDay  = new Date(year, month, 1).getDay()
  const daysCount = new Date(year, month + 1, 0).getDate()
  const today     = new Date()

  const monthEvents = events.filter(e => {
    const d = new Date(e.date + 'T12:00:00')
    return d.getFullYear() === year && d.getMonth() === month
  })

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysCount; d++) cells.push(d)

  const COLORS = [
    { value: 'default', label: 'Padrão',   color: 'var(--toffee)' },
    { value: 'green',   label: 'Verde',    color: 'var(--shared)' },
    { value: 'red',     label: 'Vermelho', color: 'var(--terra)'  },
    { value: 'blue',    label: 'Azul',     color: '#6a8eae'       },
  ]

  function colorVar(c) { return COLORS.find(x => x.value === c)?.color || 'var(--toffee)' }

  function prevMonth() { setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)) }
  function nextMonth() { setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)) }

  const upcomingEvents = events
    .filter(e => new Date(e.date + 'T12:00:00') >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)

  return (
    <div className="mini-calendar card">
      <h2 className="home-card-title">Calendário</h2>

      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
        <span className="cal-month-label">{monthNames[month]} {year}</span>
        <button className="cal-nav-btn" onClick={nextMonth}>›</button>
      </div>

      <div className="cal-grid">
        {dayNames.map((d, i) => <div key={i} className="cal-dayname">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const dateStr  = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const dayEvts  = monthEvents.filter(e => e.date === dateStr)
          const isToday  = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
          return (
            <div key={i} className={`cal-day ${isToday ? 'today' : ''} ${dayEvts.length ? 'has-events' : ''}`}>
              <span className="cal-day-num">{day}</span>
              <div className="cal-day-dots">
                {dayEvts.slice(0, 3).map(e => (
                  <span key={e.id} className="cal-dot" style={{ background: colorVar(e.color) }} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {upcomingEvents.length > 0 && (
        <div className="cal-upcoming">
          {upcomingEvents.map(e => (
            <div key={e.id} className="cal-event">
              <span className="cal-event-dot" style={{ background: colorVar(e.color) }} />
              <span className="cal-event-date">{e.date.slice(5).replace('-', '/')}</span>
              <span className="cal-event-title">{e.title}</span>
              <button className="cal-event-del" onClick={() => deleteEvent(e.id)}>×</button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="cal-add-form">
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Nome do evento..." autoFocus />
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <div className="cal-add-row">
            <select value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))}>
              <option value={settings.person1}>{settings.person1}</option>
              <option value={settings.person2}>{settings.person2}</option>
              <option value="Nós dois">Nós dois</option>
            </select>
            <select value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}>
              {COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="cal-add-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Cancelar</button>
            <button className="btn btn-primary btn-sm" onClick={addEvent}>Salvar</button>
          </div>
        </div>
      ) : (
        <button className="cal-add-btn" onClick={() => setAdding(true)}>+ Adicionar evento</button>
      )}
    </div>
  )

}

