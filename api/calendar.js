import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
    const { id } = req.query

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('date', { ascending: true })
      if (error) return res.status(500).json({ error: error.message })
      return res.json(data || [])
    }

    if (req.method === 'POST') {
      const event = {
        id:         'c' + Date.now(),
        title:      req.body.title  || '',
        date:       req.body.date   || '',
        color:      req.body.color  || 'default',
        author:     req.body.author || '',
        created_at: new Date().toISOString().split('T')[0],
      }
      const { data, error } = await supabase.from('calendar_events').insert(event).select().single()
      if (error) return res.status(500).json({ error: error.message })
      return res.json(data)
    }

    if (req.method === 'DELETE' && id) {
      await supabase.from('calendar_events').delete().eq('id', id)
      return res.json({ ok: true })
    }

    res.status(405).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}