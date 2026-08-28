import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

    if (req.method === 'POST') {
      const { base64, filename, bucket = 'photos' } = req.body
      if (!base64 || !filename) return res.status(400).json({ error: 'Dados incompletos' })

      const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const ext    = filename.split('.').pop()
      const name   = `${Date.now()}.${ext}`

      const { error } = await supabase.storage
        .from(bucket)
        .upload(name, buffer, { contentType: `image/${ext}`, upsert: false })

      if (error) return res.status(500).json({ error: error.message })

      const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${name}`
      return res.json({ url, name })
    }

    if (req.method === 'DELETE') {
      const { name, bucket = 'photos' } = req.body
      if (!name) return res.status(400).json({ error: 'Nome do arquivo obrigatório' })
      await supabase.storage.from(bucket).remove([name])
      return res.json({ ok: true })
    }

    res.status(405).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}