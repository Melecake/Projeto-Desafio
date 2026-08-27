import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return res.status(500).json({ error: 'Variáveis de ambiente não encontradas' })
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )

    const { data, error } = await supabase.storage.from('photos').list('', {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' }
    })

    if (error) return res.status(500).json({ error: error.message })

    const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    const urls = (data || [])
      .filter(f => extensions.some(ext => f.name.toLowerCase().endsWith(ext)))
      .map(f => `${process.env.SUPABASE_URL}/storage/v1/object/public/photos/${f.name}`)

    res.json(urls)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}