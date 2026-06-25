import { useState } from 'react'
import { Heart } from 'lucide-react'
import { formatRelativeTime } from '../lib/formatTime'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

function TweetCard({ tweet }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(tweet.likedByMe)
  const [likeCount, setLikeCount] = useState(tweet.likeCount)

  const profile = tweet.profiles
  const initial = profile?.username?.[0]?.toUpperCase() || '?'

  const toggleLike = async () => {
    if (liked) {
      setLiked(false)
      setLikeCount((c) => c - 1)
      await supabase.from('likes').delete().eq('user_id', user.id).eq('tweet_id', tweet.id)
    } else {
      setLiked(true)
      setLikeCount((c) => c + 1)
      await supabase.from('likes').insert({ user_id: user.id, tweet_id: tweet.id })
    }
  }

  return (
    <article className="flex gap-3 p-4 border-b border-gray-800">
      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
      
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Link to={`/profile/${profile?.username}`} className="font-bold text-white hover:underline">
            {profile?.full_name}
          </Link>
          <Link to={`/profile/${profile?.username}`} className="text-gray-500 hover:underline">
            @{profile?.username}
          </Link>
          <span className="text-gray-500">· {formatRelativeTime(tweet.created_at)}</span>
        </div>
        <p className="text-white mt-1 whitespace-pre-wrap break-words">{tweet.content}</p>

        <button
          onClick={toggleLike}
          className={`flex items-center gap-2 mt-3 text-sm transition ${liked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'
            }`}
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          {likeCount > 0 && likeCount}
        </button>
      </div>
    </article>
  )
}

export default TweetCard