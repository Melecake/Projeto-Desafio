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

  const id = req.query.id

  if (req.method === 'GET') {
    const { data } = await supabase.from('goals').select('*')
    return res.json(data || [])
  }

  if (req.method === 'POST') {
    const now = new Date()
    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                        'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
    const goal = {
      id:            'g' + Date.now(),
      title:         req.body.title || '',
      description:   req.body.description || '',
      type:          req.body.type || 'shared',
      status:        'in_progress',
      progress:      0,
      note:          '',
      history:       [],
      created_month: monthNames[now.getMonth()],
      created_at:    now.toISOString().split('T')[0],
    }
    const { data } = await supabase.from('goals').insert(goal).select().single()
    return res.json(data)
  }

  if (req.method === 'PUT' && id) {
    const { data: old } = await supabase.from('goals').select('*').eq('id', id).single()
    if (!old) return res.status(404).json({ error: 'Não encontrado' })

    const body = req.body
    const updated = { ...old, ...body }

    if (body.progress !== undefined && body.progress !== old.progress) {
      const now = new Date()
      const months = ['janeiro','fevereiro','março','abril','maio','junho',
                      'julho','agosto','setembro','outubro','novembro','dezembro']
      updated.history = [
        ...(old.history || []),
        {
          month:    months[now.getMonth()],
          progress: body.progress,
          note:     body.historyNote || '',
          date:     now.toISOString().split('T')[0],
        }
      ]
    }

    const { data } = await supabase.from('goals').update(updated).eq('id', id).select().single()
    return res.json(data)
  }

  if (req.method === 'DELETE' && id) {
    await supabase.from('goals').delete().eq('id', id)
    return res.json({ ok: true })
  }

  res.status(405).end()
}