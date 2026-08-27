import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { id } = req.query

  if (req.method === 'GET') {
    const { data } = await supabase.from('discoveries').select('*')
    return res.json(data || [])
  }

  if (req.method === 'POST') {
    const item = {
      id:          'd' + Date.now(),
      category:    req.body.category || 'filmes',
      title:       req.body.title || '',
      description: req.body.description || '',
      done:        false,
      rating:      null,
      review:      '',
      created_at:  new Date().toISOString().split('T')[0],
    }
    const { data } = await supabase.from('discoveries').insert(item).select().single()
    return res.json(data)
  }

  if (req.method === 'PUT' && id) {
    const { data } = await supabase.from('discoveries').update(req.body).eq('id', id).select().single()
    return res.json(data)
  }

  if (req.method === 'DELETE' && id) {
    await supabase.from('discoveries').delete().eq('id', id)
    return res.json({ ok: true })
  }

  res.status(405).end()
}