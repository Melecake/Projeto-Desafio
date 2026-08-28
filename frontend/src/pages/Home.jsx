import { useState, useEffect, useRef } from 'react'
import { useToast } from '../components/Toast'
import '../styles/home.css'

function PhotoCarousel() {
  const [photos, setPhotos]       = useState([])
  const [current, setCurrent]     = useState(0)
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    fetch('/api/photos')
      .then(r => r.json())
      .then(list => { if (Array.isArray(list) && list.length) setPhotos(list) })
  }, [])

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

  if (photos.length === 0) return null

  const total   = photos.length
  const prevIdx = (current - 1 + total) % total
  const nextIdx = (current + 1) % total
  const showSide = total >= 3

  return (
    <div className="carousel">
      <div className={`carousel-stage ${animating ? 'animating' : ''}`}>
        {showSide && (
          <div className="carousel-side" onClick={() => go(prevIdx)}>
            <img src={photos[prevIdx]} alt="" className="carousel-side-img" />
            <div className="carousel-side-overlay" />
          </div>
        )}
        <div className="carousel-main">
          <img src={photos[current]} alt="" className="carousel-main-img" />
          <button className="carousel-btn prev" onClick={() => go(prevIdx)}>‹</button>
          <button className="carousel-btn next" onClick={() => go(nextIdx)}>›</button>
        </div>
        {showSide && (
          <div className="carousel-side" onClick={() => go(nextIdx)}>
            <img src={photos[nextIdx]} alt="" className="carousel-side-img" />
            <div className="carousel-side-overlay" />
          </div>
        )}
      </div>
      <div className="carousel-dots">
        {photos.map((_, i) => (
          <button key={i} className={`carousel-dot ${i === current ? 'active' : ''}`} onClick={() => go(i)} />
        ))}
      </div>
    </div>
  )
}

function QuickNotes({ notes, settings, reload }) {
  const [text, setText]     = useState('')
  const [author, setAuthor] = useState(settings.person1)
  const toast = useToast()

  async function addNote() {
    if (!text.trim()) return
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author })
    })
    setText('')
    toast('Recado deixado')
    reload()
  }

  async function deleteNote(id) {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    toast('Recado removido', 'error')
    reload()
  }

  return (
    <div className="quick-notes card">
      <h2 className="home-card-title">Mural de recados</h2>

      <div className="notes-list">
        {notes.length === 0 && (
          <p className="notes-empty">Nenhum recado ainda. Deixe um para o outro.</p>
        )}
        {notes.slice(0, 5).map(n => (
          <div key={n.id} className="note-item">
            <div className="note-header">
              <span className="note-author">{n.author}</span>
              <span className="note-date">{n.created_at}</span>
              <button className="note-del" onClick={() => deleteNote(n.id)}>×</button>
            </div>
            <p className="note-text">{n.text}</p>
          </div>
        ))}
      </div>

      <div className="notes-form">
        <select
          className="filter-select"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          style={{ width: 'auto', minWidth: '110px' }}
        >
          <option value={settings.person1}>{settings.person1}</option>
          <option value={settings.person2}>{settings.person2}</option>
        </select>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Deixar um recado..."
          onKeyDown={e => e.key === 'Enter' && addNote()}
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary btn-sm" onClick={addNote}>Enviar</button>
      </div>
    </div>
  )
}

export default function Home({ data, reload }) {
  const { goals, months, settings, notes = [], discoveries = [] } = data

  const shared  = goals.filter(g => g.type === 'shared')
  const person1 = goals.filter(g => g.type === 'person1')
  const person2 = goals.filter(g => g.type === 'person2')
  const done    = goals.filter(g => g.status === 'done')

  // Conquistas por categoria
  const conquistas = [
    { label: 'Filmes',   count: discoveries.filter(d => d.category === 'filmes'   && d.done).length },
    { label: 'Séries',   count: discoveries.filter(d => d.category === 'series'   && d.done).length },
    { label: 'Receitas', count: discoveries.filter(d => d.category === 'receitas' && d.done).length },
    { label: 'Livros',   count: discoveries.filter(d => d.category === 'livros'   && d.done).length },
    { label: 'Jogos',    count: discoveries.filter(d => d.category === 'jogos'    && d.done).length },
  ].filter(c => c.count > 0)

  // Última descoberta
  const lastDiscovery = [...discoveries].sort((a, b) =>
    (b.created_at || '').localeCompare(a.created_at || '')
  )[0]

  // Próximo mês — aviso nos últimos 7 dias
  const now           = new Date()
  const daysInMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeft      = daysInMonth - now.getDate()
  const monthEndSoon  = daysLeft <= 7

  const monthNames    = ['janeiro','fevereiro','março','abril','maio','junho',
                         'julho','agosto','setembro','outubro','novembro','dezembro']
  const currentMonth  = monthNames[now.getMonth()]
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

      {/* Aviso fim de mês */}
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

          {/* Como estamos */}
          <div className="home-stats card">
            <h2 className="home-card-title">Como estamos</h2>
            <div className="stats-single">
              <span className="stat-number-big">{done.length}</span>
              <span className="stat-label-big">
                {done.length === 1 ? 'objetivo concluído' : 'objetivos concluídos'}
              </span>
            </div>
            <p className="stats-sub">de {goals.length} no total</p>
          </div>

          {/* Conquistas */}
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

          {/* Última descoberta */}
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

          {/* Objetivos individuais */}
          <div className="home-individual card">
            <h2 className="home-card-title">Objetivos individuais</h2>
            <div className="individual-row">
              <div className="individual-person">
                <span className="individual-name">{settings.person1}</span>
                <ul className="individual-list">
                  {person1.filter(g => g.status !== 'done' && g.status !== 'not_achieved').map(g => (
                    <li key={g.id} className="individual-list-item">
                      {g.favorited && <span className="fav-star">★ </span>}
                      {g.title}
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
                      {g.favorited && <span className="fav-star">★ </span>}
                      {g.title}
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

          {/* Timeline */}
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

          {/* Nossos objetivos */}
          <div className="home-shared card">
            <h2 className="home-card-title">Nossos objetivos</h2>
            {shared.filter(g => g.status !== 'done' && g.status !== 'not_achieved').length === 0
              ? <p className="home-empty-text">Nenhum objetivo compartilhado ativo.</p>
              : shared.filter(g => g.status !== 'done' && g.status !== 'not_achieved').map(g => (
                <div key={g.id} className="shared-goal-item">
                  <span className="shared-goal-title">
                    {g.favorited && <span className="fav-star">★ </span>}
                    {g.title}
                  </span>
                  {g.description && <p className="shared-goal-note">{g.description}</p>}
                </div>
              ))
            }
          </div>

          {/* Mural de recados */}
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