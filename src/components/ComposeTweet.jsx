import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const MAX_LENGTH = 280

function ComposeTweet({ onTweetCreated }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    const { error } = await supabase
      .from('tweets')
      .insert({ user_id: user.id, content: content.trim() })
    setLoading(false)

    if (error) return alert(error.message)
    setContent('')
    onTweetCreated()
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-gray-800">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={MAX_LENGTH}
        placeholder="¿Qué está pasando?"
        rows={3}
        className="w-full bg-transparent text-white text-lg placeholder-gray-500 resize-none outline-none"
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-gray-500">{content.length}/{MAX_LENGTH}</span>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-blue-500 text-white px-5 py-2 rounded-full font-bold disabled:opacity-50"
        >
          {loading ? 'Publicando...' : 'Postear'}
        </button>
      </div>
    </form>
  )
}

export default ComposeTweet