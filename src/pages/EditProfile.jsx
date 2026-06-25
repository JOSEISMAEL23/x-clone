import { useState} from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function EditProfile() {
  const { profile, user, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [preview, setPreview] = useState(profile?.avatar_url || null)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    let avatarUrl = profile?.avatar_url || null

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`

     const { error: uploadError } = await supabase
        .storage.from('avatars')
        .upload(path, avatarFile, { upsert: true })

      if (uploadError) {
        alert(uploadError.message)
        setSaving(false)
        return
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      avatarUrl = `${data.publicUrl}?t=${Date.now()}`
    }

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, bio, avatar_url: avatarUrl })
      .eq('id', user.id)

    setSaving(false)
    if (error) return alert(error.message)

    await refreshProfile()
    navigate(`/profile/${profile.username}`)
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold border-b border-gray-800 pb-4 mb-4">Editar perfil</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-blue-500 overflow-hidden flex items-center justify-center text-2xl font-bold">
            {preview ? (
              <img src={preview} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              profile?.username?.[0]?.toUpperCase()
            )}
          </div>
          <label className="cursor-pointer text-blue-500 font-bold">
            Cambiar foto
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">Nombre completo</label>
          <input
            type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="w-full p-3 rounded bg-gray-900 text-white border border-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">Bio</label>
          <textarea
            value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
            className="w-full p-3 rounded bg-gray-900 text-white border border-gray-700 resize-none"
          />
        </div>

        <button
          type="submit" disabled={saving}
          className="bg-blue-500 text-white px-5 py-2 rounded-full font-bold disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}

export default EditProfile