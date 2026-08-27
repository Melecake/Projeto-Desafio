import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Goals from './pages/Goals'
import Months from './pages/Months'
import Discoveries from './pages/Discoveries'
import History from './pages/History'

export default function App() {
  const [page, setPage]   = useState('home')
  const [data, setData]   = useState(null)
  const [error, setError] = useState(null)

  async function loadData() {
    try {
      const res = await fetch('/api/data')
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Status ${res.status}: ${text}`)
      }
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => { loadData() }, [])

  if (error) return (
    <div className="loading" style={{ flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
      <p style={{ color: '#c47a7a', fontFamily: 'Lora, serif' }}>Erro ao carregar os dados</p>
      <pre style={{ fontSize: '0.75rem', color: '#9c8878', whiteSpace: 'pre-wrap', maxWidth: '600px' }}>{error}</pre>
      <button
        onClick={loadData}
        style={{ marginTop: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '20px',
                 border: '1px solid #d6cdc0', background: 'none', cursor: 'pointer',
                 fontFamily: 'Inter, sans-serif', color: '#7f5539' }}
      >
        Tentar novamente
      </button>
    </div>
  )

  if (!data) return (
    <div className="loading">
      <p>Carregando o Momorecos Challenge...</p>
    </div>
  )

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} />
      <div className="main-wrapper">
        <main className="main-content">
          {page === 'home'        && <Home        data={data} reload={loadData} />}
          {page === 'goals'       && <Goals       data={data} reload={loadData} />}
          {page === 'months'      && <Months      data={data} reload={loadData} />}
          {page === 'discoveries' && <Discoveries data={data} reload={loadData} />}
          {page === 'history'     && <History     data={data} reload={loadData} />}
        </main>
      </div>
    </div>
  )
}