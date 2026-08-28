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

export default function Home({ data, reload }) {
  const { goals, months, settings, notes = [], discoveries = [] } = data

  const shared  = goals.filter(g => g.type === 'shared')
  const person1 = goals.filter(g => g.type === 'person1')
  const person2 = goals.filter(g => g.type === 'person2')
  const done    = goals.filter(g => g.status === 'done')

  const conquistas = [
    { label: 'Filmes',   count: discoveries.filter(d => d.category === 'filmes'   && d.done).length },
    { label: 'Séries',   count: discoveries.filter(d => d.category === 'series'   && d.done).length },
    { label: 'Receitas', count: discoveries.filter(d => d.category === 'receitas' && d.done).length },
    { label: 'Livros',   count: discoveries.filter(d => d.category === 'livros'   && d.done).length },
    { label: 'Jogos',    count: discoveries.filter(d => d.category === 'jogos'    && d.done).length },
  ].filter(c => c.count > 0)

  const lastDiscovery = [...discoveries].sort((a, b) =>
    (b.created_at || '').localeCompare(a.created_at || '')
  )[0]

  const now          = new Date()
  const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeft     = daysInMonth - now.getDate()
  const monthEndSoon = daysLeft <= 7

  const monthNames       = ['janeiro','fevereiro','março','abril','maio','junho',
                             'julho','agosto','setembro','outubro','novembro','dezembro']
  const currentMonth     = monthNames[now.getMonth()]
  const currentMonthData = months.find(m => m.month === currentMonth)
  const currentMonthEmpty = currentMonthData && !currentMonthData.reflection1 && !currentMonthData.reflection2

  const recentMonths = [...months]
    .filter(m => m.reflection1 || m.reflection2 || m.events.length || m.specialMoments.length)
    .slice(-2)

  const timeline = [
    { id: 'setembro', label: 'Setembro' },
    { id: 'outubro',  label: 'Outubro'  },
    { id: 'novembro', label: 'Novembro' },
    { id: 'dezembro', label: 'Dezembro' },
  ]

  return (
    <div className="home">
      <div className="home-hero">
        <div className="home-decoration">✦ · ✦ · ✦</div>
        <h1 className="home-title">Momorecos Challenge</h1>
        <p className="home-subtitle">Apenas dois namos se motivando a cada dia, lesgooo!!!</p>
      </div>

      <PhotoCarousel />

      {monthEndSoon && currentMonthEmpty && (
        <div className="month-end-banner">
          <span className="month-end-icon">◷</span>
          <div>
            <p className="month-end-title">O mês está quase acabando</p>
            <p className="month-end-sub">Que tal registrar como foi {currentMonthData?.label}?</p>
          </div>
        </div>
      )}

      <div className="home-grid">
        <div className="home-col-left">

          <div className="home-stats card">
            <h2 className="home-card-title">Como estamos</h2>
            <div className="stats-single">
              <span className="stat-number-big">{done.length}</span>
              <span className="stat-label-big">{done.length === 1 ? 'objetivo concluído' : 'objetivos concluídos'}</span>
            </div>
            <p className="stats-sub">de {goals.length} no total</p>
          </div>

          {conquistas.length > 0 && (
            <div className="home-conquistas card">
              <h2 className="home-card-title">Descobertas concluídas</h2>
              <div className="conquistas-list">
                {conquistas.map(c => (
                  <div key={c.label} className="conquista-item">
                    <span className="conquista-label">{c.label}</span>
                    <span className="conquista-count">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lastDiscovery && (
            <div className="home-last-discovery card">
              <h2 className="home-card-title">Última descoberta</h2>
              <p className="last-discovery-category">
                {lastDiscovery.category.charAt(0).toUpperCase() + lastDiscovery.category.slice(1)}
              </p>
              <p className="last-discovery-title">{lastDiscovery.title}</p>
              {lastDiscovery.done && lastDiscovery.rating && (
                <div className="last-discovery-stars">
                  {[1,2,3,4,5].map(n => (
                    <span key={n} className={`star-display ${n <= lastDiscovery.rating ? 'filled' : ''}`}>★</span>
                  ))}
                </div>
              )}
              <p className="last-discovery-date">
                {lastDiscovery.done ? 'Concluído' : 'Adicionado'} em {lastDiscovery.created_at}
              </p>
            </div>
          )}

          <div className="home-individual card">
            <h2 className="home-card-title">Objetivos individuais</h2>
            <div className="individual-row">
              <div className="individual-person">
                <span className="individual-name">{settings.person1}</span>
                <ul className="individual-list">
                  {person1.filter(g => g.status !== 'done' && g.status !== 'not_achieved').map(g => (
                    <li key={g.id} className="individual-list-item">
                      {g.favorited && <span className="fav-star">★ </span>}{g.title}
                    </li>
                  ))}
                  {person1.filter(g => g.status !== 'done' && g.status !== 'not_achieved').length === 0 && (
                    <li className="individual-empty">Nenhum ainda</li>
                  )}
                </ul>
              </div>
              <div className="individual-divider" />
              <div className="individual-person">
                <span className="individual-name">{settings.person2}</span>
                <ul className="individual-list">
                  {person2.filter(g => g.status !== 'done' && g.status !== 'not_achieved').map(g => (
                    <li key={g.id} className="individual-list-item">
                      {g.favorited && <span className="fav-star">★ </span>}{g.title}
                    </li>
                  ))}
                  {person2.filter(g => g.status !== 'done' && g.status !== 'not_achieved').length === 0 && (
                    <li className="individual-empty">Nenhum ainda</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

        </div>

        <div className="home-col-right">

          <MiniCalendar settings={settings} />

          <div className="home-timeline card">
            <h2 className="home-card-title">Nossa jornada</h2>
            <div className="timeline">
              {timeline.map((t, i) => {
                const monthData = months.find(m => m.month === t.id)
                const isCurrent = t.id === currentMonth
                const hasCont   = monthData && (
                  monthData.reflection1 || monthData.reflection2 ||
                  monthData.events.length || monthData.specialMoments.length
                )
                return (
                  <div key={t.id} className={`timeline-item ${isCurrent ? 'current' : ''} ${hasCont ? 'has-content' : ''}`}>
                    <div className="timeline-dot" />
                    {i < timeline.length - 1 && <div className="timeline-line" />}
                    <div className="timeline-content">
                      <span className="timeline-month">{t.label}</span>
                      {isCurrent && <span className="timeline-here">estamos aqui</span>}
                      {hasCont && !isCurrent && <span className="timeline-done">registrado</span>}
                    </div>
                  </div>
                )
              })}
              <div className="timeline-reunion">
                <div className="reunion-dot">*</div>
                <div className="timeline-content">
                  <span className="timeline-month">18 de dezembro</span>
                  <span className="timeline-done">reencontro</span>
                </div>
              </div>
            </div>
          </div>

          <div className="home-shared card">
            <h2 className="home-card-title">Nossos objetivos</h2>
            {shared.filter(g => g.status !== 'done' && g.status !== 'not_achieved').length === 0
              ? <p className="home-empty-text">Nenhum objetivo compartilhado ativo.</p>
              : shared.filter(g => g.status !== 'done' && g.status !== 'not_achieved').map(g => (
                <div key={g.id} className="shared-goal-item">
                  <span className="shared-goal-title">
                    {g.favorited && <span className="fav-star">★ </span>}{g.title}
                  </span>
                  {g.description && <p className="shared-goal-note">{g.description}</p>}
                </div>
              ))
            }
          </div>

          <QuickNotes notes={notes} settings={settings} reload={reload} />

        </div>
      </div>

      {recentMonths.length > 0 && (
        <>
          <hr className="divider" />
          <div className="home-recent">
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>Últimos registros</h2>
            <div className="recent-grid">
              {recentMonths.map(m => (
                <div key={m.id} className="recent-month card">
                  <span className="recent-month-label">{m.label}</span>
                  <div className="recent-month-meta">
                    {m.events.length > 0 && <span className="recent-meta-tag">{m.events.length} acontecimento{m.events.length > 1 ? 's' : ''}</span>}
                    {m.specialMoments.length > 0 && <span className="recent-meta-tag">{m.specialMoments.length} momento{m.specialMoments.length > 1 ? 's' : ''} especial{m.specialMoments.length > 1 ? 'is' : ''}</span>}
                  </div>
                  {m.reflection1 && (
                    <div className="recent-reflection">
                      <span className="recent-person">{settings.person1}</span>
                      <p className="recent-text">{m.reflection1.slice(0, 180)}{m.reflection1.length > 180 ? '…' : ''}</p>
                    </div>
                  )}
                  {m.reflection2 && (
                    <div className="recent-reflection">
                      <span className="recent-person">{settings.person2}</span>
                      <p className="recent-text">{m.reflection2.slice(0, 180)}{m.reflection2.length > 180 ? '…' : ''}</p>
                    </div>
                  )}
                  {m.specialMoments.length > 0 && (
                    <div className="recent-moments">
                      {m.specialMoments.slice(0, 3).map(s => (
                        <span key={s.id} className="recent-moment-tag">{s.text}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}