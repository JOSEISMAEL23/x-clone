import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ComposeTweet from '../components/ComposeTweet'
import TweetCard from '../components/TweetCard'

function Feed() {
  const { user } = useAuth()
  const [tweets, setTweets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchTweets = useCallback(async () => {
    const { data, error } = await supabase
      .from('tweets')
      .select('*, profiles(username, full_name, avatar_url), likes(count)')
      .order('created_at', { ascending: false })

    if (error) {
      setLoading(false)
      return
    }

    const { data: myLikes } = await supabase
      .from('likes')
      .select('tweet_id')
      .eq('user_id', user.id)

    const likedIds = new Set(myLikes?.map((l) => l.tweet_id))

    const tweetsWithLikes = data.map((tweet) => ({
      ...tweet,
      likeCount: tweet.likes[0]?.count ?? 0,
      likedByMe: likedIds.has(tweet.id),
    }))

    setTweets(tweetsWithLikes)
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    fetchTweets()
  }, [fetchTweets])

  const visibles = tweets.filter((tweet) =>
    (tweet.profiles?.username || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <h1 className="text-xl font-bold p-4 border-b border-gray-800">Inicio</h1>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="buscar usuario por letras"
        className="w-full p-3 bg-black text-white placeholder-gray-500 border-b border-gray-800 outline-none"
      />
      <ComposeTweet onTweetCreated={fetchTweets} />
      {loading ? (
        <p className="p-4 text-gray-500">Cargando tweets...</p>
      ) : visibles.length === 0 ? (
        <p className="p-4 text-gray-500">
          {search ? 'Ningún usuario coincide con: ' + search : 'Todavía no hay tweets. ¡Sé el primero!'}
        </p>
      ) : (
        visibles.map((tweet) => <TweetCard key={tweet.id} tweet={tweet} />)
      )}
    </div>
  )
}

export default Feed
