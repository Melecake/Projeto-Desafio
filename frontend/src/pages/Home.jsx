import { useState, useEffect, useRef } from 'react'
import '../styles/home.css'

function PhotoCarousel() {
  const [photos, setPhotos]   = useState([])
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    fetch('/api/photos')
      .then(r => r.json())
      .then(list => { if (list.length) setPhotos(list) })
  }, [])

  function startTimer(list) {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % list.length)
    }, 10000)
  }

  useEffect(() => {
    if (photos.length < 2) return
    startTimer(photos)
    return () => clearInterval(timerRef.current)
  }, [photos])

  if (photos.length === 0) return null

  const total  = photos.length
  const prev   = (current - 1 + total) % total
  const next   = (current + 1) % total

  function go(idx) {
    setCurrent(idx)
    startTimer(photos)
  }

  // para N < 3 evitar duplicar o mesmo slide
  const showPrev = total >= 2
  const showNext = total >= 3 || (total === 2 && prev !== next)

  return (
    <div className="carousel">
      <div className="carousel-stage">

        {showPrev && (
          <div className="carousel-side prev-side" onClick={() => go(prev)}>
            <img src={photos[prev]} alt="" className="carousel-side-img" />
            <div className="carousel-side-overlay" />
          </div>
        )}

        <div className="carousel-main">
          <img src={photos[current]} alt="" className="carousel-main-img" />
        </div>

        {showNext && (
          <div className="carousel-side next-side" onClick={() => go(next)}>
            <img src={photos[next]} alt="" className="carousel-side-img" />
            <div className="carousel-side-overlay" />
          </div>
        )}

      </div>

      <div className="carousel-dots">
        {photos.map((_, i) => (
          <button
            key={i}
            className={`carousel-dot ${i === current ? 'active' : ''}`}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  )
}
export default function Home({ data }) {
  const { goals, months, settings } = data

  const shared  = goals.filter(g => g.type === 'shared')
  const person1 = goals.filter(g => g.type === 'person1')
  const person2 = goals.filter(g => g.type === 'person2')
  const done    = goals.filter(g => g.status === 'done')

  const recentMonths = [...months]
    .filter(m => m.reflection1 || m.reflection2 || m.events.length || m.specialMoments.length)
    .slice(-2)

  const timeline = [
    { id: 'setembro', label: 'Setembro' },
    { id: 'outubro',  label: 'Outubro'  },
    { id: 'novembro', label: 'Novembro' },
    { id: 'dezembro', label: 'Dezembro' },
  ]

  const now = new Date()
  const currentMonth = ['janeiro','fevereiro','março','abril','maio','junho',
    'julho','agosto','setembro','outubro','novembro','dezembro'][now.getMonth()]

  return (
    <div className="home">

      {/* Hero */}
      <div className="home-hero">
        <div className="home-decoration">✦ · ✦ · ✦</div>
        <h1 className="home-title">Momorecos Challenge</h1>
        <p className="home-subtitle">
          Apenas dois namos se motivando a cada dia, lesgooo!!!
        </p>
      </div>

      {/* Carrossel */}
      <PhotoCarousel />

      {/* Grid principal */}
      <div className="home-grid">

        <div className="home-col-left">

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

          <div className="home-individual card">
            <h2 className="home-card-title">Objetivos individuais</h2>
            <div className="individual-row">
              <div className="individual-person">
                <span className="individual-name">{settings.person1}</span>
                <ul className="individual-list">
                  {person1.filter(g => g.status !== 'done' && g.status !== 'not_achieved').map(g => (
                    <li key={g.id} className="individual-list-item">{g.title}</li>
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
                    <li key={g.id} className="individual-list-item">{g.title}</li>
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
                  <span className="shared-goal-title">{g.title}</span>
                  {g.description && <p className="shared-goal-note">{g.description}</p>}
                </div>
              ))
            }
          </div>

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