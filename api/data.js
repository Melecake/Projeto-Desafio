import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return res.status(500).json({ error: 'Variáveis de ambiente não encontradas' })
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

    const [
      { data: settingsRows, error: e1 },
      { data: goals,        error: e2 },
      { data: months,       error: e3 },
      { data: discoveries,  error: e4 },
      { data: notes,        error: e5 },
    ] = await Promise.all([
      supabase.from('settings').select('*'),
      supabase.from('goals').select('*'),
      supabase.from('months').select('*'),
      supabase.from('discoveries').select('*'),
      supabase.from('notes').select('*').order('created_at', { ascending: false }),
    ])

    if (e1 || e2 || e3 || e4 || e5) {
      return res.status(500).json({ errors: { e1, e2, e3, e4, e5 } })
    }

    const settings = {}
    settingsRows?.forEach(r => { settings[r.key] = r.value })

    res.json({
      settings: {
        person1:     settings.person1      || 'João',
        person2:     settings.person2      || 'Marianna',
        reunionDate: settings.reunion_date || '2026-12-18',
      },
      goals:       goals || [],
      months:      (months || []).map(m => ({
        ...m,
        specialMoments: m.special_moments || [],
        events:         m.events          || [],
      })),
      discoveries: discoveries || [],
      notes:       notes       || [],
    })
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack })
  }
}