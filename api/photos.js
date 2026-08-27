import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('photos')
        .select('url')
        .order('created_at', { ascending: true })

      if (error) return res.status(500).json({ error: error.message })
      return res.json((data || []).map(p => p.url))
    }

    if (req.method === 'POST') {
      const { url } = req.body
      if (!url) return res.status(400).json({ error: 'URL obrigatória' })
      const item = { id: 'p' + Date.now(), url, created_at: new Date().toISOString().split('T')[0] }
      const { data, error } = await supabase.from('photos').insert(item).select().single()
      if (error) return res.status(500).json({ error: error.message })
      return res.json(data)
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      await supabase.from('photos').delete().eq('id', id)
      return res.json({ ok: true })
    }

    res.status(405).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}