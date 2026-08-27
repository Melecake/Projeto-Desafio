import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Goals from './pages/Goals'
import Months from './pages/Months'
import Discoveries from './pages/Discoveries'
import History from './pages/History'

export default function App() {
  const [page, setPage] = useState('home')
  const [data, setData] = useState(null)

  async function loadData() {
    const res = await fetch('/api/data')
    const json = await res.json()
    setData(json)
  }

  useEffect(() => { loadData() }, [])

  if (!data) return (
    <div className="loading">
      <p>Carregando o Morecos Challenge...</p>
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