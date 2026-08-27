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

  const { id, sub, subId } = req.query

  if (req.method === 'GET') {
    const { data } = await supabase.from('months').select('*')
    return res.json((data || []).map(m => ({
      ...m,
      specialMoments: m.special_moments || [],
      events:         m.events          || [],
    })))
  }

  if (req.method === 'PUT' && id && !sub) {
    const { data: old } = await supabase.from('months').select('*').eq('id', id).single()
    if (!old) return res.status(404).json({ error: 'Não encontrado' })
    const updated = { ...old, ...req.body }
    const { data } = await supabase.from('months').update(updated).eq('id', id).select().single()
    return res.json({ ...data, specialMoments: data.special_moments || [], events: data.events || [] })
  }

  // POST event
  if (req.method === 'POST' && id && sub === 'events') {
    const { data: month } = await supabase.from('months').select('*').eq('id', id).single()
    if (!month) return res.status(404).json({ error: 'Não encontrado' })
    const event = { id: 'e' + Date.now(), text: req.body.text || '', createdAt: new Date().toISOString().split('T')[0] }
    const events = [...(month.events || []), event]
    await supabase.from('months').update({ events }).eq('id', id)
    return res.json(event)
  }

  // DELETE event
  if (req.method === 'DELETE' && id && sub === 'events' && subId) {
    const { data: month } = await supabase.from('months').select('*').eq('id', id).single()
    if (!month) return res.status(404).json({ error: 'Não encontrado' })
    const events = (month.events || []).filter(e => e.id !== subId)
    await supabase.from('months').update({ events }).eq('id', id)
    return res.json({ ok: true })
  }

  // POST moment
  if (req.method === 'POST' && id && sub === 'moments') {
    const { data: month } = await supabase.from('months').select('*').eq('id', id).single()
    if (!month) return res.status(404).json({ error: 'Não encontrado' })
    const moment = { id: 'm' + Date.now(), text: req.body.text || '', createdAt: new Date().toISOString().split('T')[0] }
    const special_moments = [...(month.special_moments || []), moment]
    await supabase.from('months').update({ special_moments }).eq('id', id)
    return res.json(moment)
  }

  // DELETE moment
  if (req.method === 'DELETE' && id && sub === 'moments' && subId) {
    const { data: month } = await supabase.from('months').select('*').eq('id', id).single()
    if (!month) return res.status(404).json({ error: 'Não encontrado' })
    const special_moments = (month.special_moments || []).filter(m => m.id !== subId)
    await supabase.from('months').update({ special_moments }).eq('id', id)
    return res.json({ ok: true })
  }

  res.status(405).end()
}