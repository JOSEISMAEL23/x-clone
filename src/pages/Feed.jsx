import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ComposeTweet from '../components/ComposeTweet'
import TweetCard from '../components/TweetCard'

function Feed() {
  const { user } = useAuth()
  const [tweets, setTweets] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div>
      <h1 className="text-xl font-bold p-4 border-b border-gray-800">Inicio</h1>
      <ComposeTweet onTweetCreated={fetchTweets} />
      {loading ? (
        <p className="p-4 text-gray-500">Cargando tweets...</p>
      ) : tweets.length === 0 ? (
        <p className="p-4 text-gray-500">Todavía no hay tweets. ¡Sé el primero!</p>
      ) : (
        tweets.map((tweet) => <TweetCard key={tweet.id} tweet={tweet} />)
      )}
    </div>
  )
}

export default Feed