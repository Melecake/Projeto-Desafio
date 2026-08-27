import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { data: settingsRows } = await supabase.from('settings').select('*')
  const settings = {}
  settingsRows?.forEach(r => { settings[r.key] = r.value })

  const { data: goals }       = await supabase.from('goals').select('*')
  const { data: months }      = await supabase.from('months').select('*')
  const { data: discoveries } = await supabase.from('discoveries').select('*')

  res.json({
    settings: {
      person1:     settings.person1     || 'João',
      person2:     settings.person2     || 'Marianna',
      reunionDate: settings.reunion_date || '2026-12-18',
    },
    goals:       goals       || [],
    months:      (months || []).map(m => ({
      ...m,
      specialMoments: m.special_moments || [],
      events:         m.events          || [],
    })),
    discoveries: discoveries || [],
  })
}