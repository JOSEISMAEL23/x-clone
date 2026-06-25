import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import TweetCard from '../components/TweetCard'

function Profile() {
  const { username } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [tweets, setTweets] = useState([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    setLoading(true)

    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('username', username).single()

    if (!profileData) {
      setLoading(false)
      return
    }
    setProfile(profileData)

    const { data: tweetsData } = await supabase
      .from('tweets')
      .select('*, profiles(username, full_name, avatar_url), likes(count)')
      .eq('user_id', profileData.id)
      .order('created_at', { ascending: false })

    const { data: myLikes } = await supabase
      .from('likes').select('tweet_id').eq('user_id', user.id)
    const likedIds = new Set(myLikes?.map((l) => l.tweet_id))

    setTweets(
      (tweetsData || []).map((t) => ({
        ...t,
        likeCount: t.likes[0]?.count ?? 0,
        likedByMe: likedIds.has(t.id),
      }))
    )

    const { count: followers } = await supabase
      .from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileData.id)
    setFollowersCount(followers ?? 0)

    const { count: following } = await supabase
      .from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileData.id)
    setFollowingCount(following ?? 0)

    const { data: followRow } = await supabase
      .from('follows').select('*')
      .eq('follower_id', user.id).eq('following_id', profileData.id).maybeSingle()
    setIsFollowing(!!followRow)

    setLoading(false)
  }, [username, user.id])

  useEffect(() => { loadProfile() }, [loadProfile])

  const toggleFollow = async () => {
    if (isFollowing) {
      setIsFollowing(false)
      setFollowersCount((c) => c - 1)
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.id)
    } else {
      setIsFollowing(true)
      setFollowersCount((c) => c + 1)
      await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id })
    }
  }

  if (loading) return <p className="p-4 text-gray-500">Cargando perfil...</p>
  if (!profile) return <p className="p-4 text-gray-500">Usuario no encontrado.</p>

  const isOwnProfile = profile.id === user.id

  return (
    <div>
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-2xl font-bold text-white">
            {profile.username[0]?.toUpperCase()}
          </div>
          {!isOwnProfile && (
            <button
              onClick={toggleFollow}
              className={`px-4 py-2 rounded-full font-bold transition ${
                isFollowing
                  ? 'bg-transparent border border-gray-600 text-white hover:border-red-500 hover:text-red-500'
                  : 'bg-white text-black'
              }`}
            >
              {isFollowing ? 'Siguiendo' : 'Seguir'}
            </button>
          )}
        </div>

        <h2 className="text-xl font-bold mt-3">{profile.full_name}</h2>
        <p className="text-gray-500">@{profile.username}</p>
        {profile.bio && <p className="mt-2">{profile.bio}</p>}

        <div className="flex gap-4 mt-3 text-sm">
          <span><strong>{followingCount}</strong> <span className="text-gray-500">Siguiendo</span></span>
          <span><strong>{followersCount}</strong> <span className="text-gray-500">Seguidores</span></span>
        </div>
      </div>

      {tweets.length === 0 ? (
        <p className="p-4 text-gray-500">Este usuario todavía no ha tuiteado.</p>
      ) : (
        tweets.map((tweet) => <TweetCard key={tweet.id} tweet={tweet} />)
      )}
    </div>
  )
}

export default Profile