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
        .from('journal')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) return res.status(500).json({ error: error.message })
      return res.json(data || [])
    }

    if (req.method === 'POST') {
      const now = new Date().toISOString().split('T')[0]
      const entry = {
        id:         'j' + Date.now(),
        title:      req.body.title  || '',
        body:       req.body.body   || '',
        author:     req.body.author || '',
        created_at: now,
        updated_at: now,
      }
      const { data, error } = await supabase.from('journal').insert(entry).select().single()
      if (error) return res.status(500).json({ error: error.message })
      return res.json(data)
    }

    if (req.method === 'PUT' && id) {
      const updates = {
        ...req.body,
        updated_at: new Date().toISOString().split('T')[0]
      }
      const { data, error } = await supabase
        .from('journal').update(updates).eq('id', id).select().single()
      if (error) return res.status(500).json({ error: error.message })
      return res.json(data)
    }

    if (req.method === 'DELETE' && id) {
      await supabase.from('journal').delete().eq('id', id)
      return res.json({ ok: true })
    }

    res.status(405).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}