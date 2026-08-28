export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { query, type } = req.query
  if (!query) return res.status(400).json({ error: 'Query obrigatória' })

  const mediaType = type === 'series' ? 'tv' : 'movie'

  try {
    const url = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${process.env.TMDB_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`
    const response = await fetch(url)
    const data = await response.json()

    const results = (data.results || []).slice(0, 5).map(item => ({
      id:       item.id,
      title:    item.title || item.name,
      overview: item.overview,
      poster:   item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : null,
      year:     (item.release_date || item.first_air_date || '').slice(0, 4),
      rating:   item.vote_average ? item.vote_average.toFixed(1) : null,
    }))

    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}