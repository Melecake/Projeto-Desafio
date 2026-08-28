import { useState, useRef } from 'react'
import '../styles/imageupload.css'

export default function ImageUpload({ onUpload, bucket = 'photos', label = 'Adicionar imagem' }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview]     = useState(null)
  const inputRef = useRef(null)

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setPreview(URL.createObjectURL(file))

    try {
      const base64 = await toBase64(file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, filename: file.name, bucket })
      })
      const data = await res.json()
      if (data.url) onUpload(data.url, data.name)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="image-upload">
      <button
        type="button"
        className="image-upload-btn"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? 'Enviando...' : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      {preview && !uploading && (
        <img src={preview} alt="" className="image-upload-preview" />
      )}
    </div>
  )
}