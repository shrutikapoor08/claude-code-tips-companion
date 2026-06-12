import { useState, useEffect } from 'react'
import './YouTubeVideos.css'

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY
const CHANNEL_HANDLE = 'shrutikapoor08'

export default function YouTubeVideos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pageToken, setPageToken] = useState(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchVideos = async (token = null) => {
    if (!API_KEY) {
      setError('Missing VITE_YOUTUBE_API_KEY. Add it to a .env file at the project root.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?forHandle=${CHANNEL_HANDLE}&part=contentDetails&key=${API_KEY}`
      )
      if (!channelRes.ok) throw new Error(`Channel lookup failed: ${channelRes.status}`)
      const channelData = await channelRes.json()

      const uploadsPlaylistId =
        channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
      if (!uploadsPlaylistId) throw new Error('Could not find uploads playlist')

      let url = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${uploadsPlaylistId}&part=snippet&maxResults=12&key=${API_KEY}`
      if (token) url += `&pageToken=${token}`

      const videosRes = await fetch(url)
      if (!videosRes.ok) throw new Error(`Videos fetch failed: ${videosRes.status}`)
      const videosData = await videosRes.json()

      setVideos((prev) =>
        token ? [...prev, ...videosData.items] : videosData.items
      )
      setPageToken(videosData.nextPageToken || null)
      setHasMore(!!videosData.nextPageToken)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  if (error) {
    return (
      <div className="yt-videos">
        <h2>My YouTube Videos</h2>
        <p className="yt-error">{error}</p>
      </div>
    )
  }

  if (loading && videos.length === 0) {
    return (
      <div className="yt-videos">
        <h2>My YouTube Videos</h2>
        <p>Loading videos...</p>
      </div>
    )
  }

  return (
    <div className="yt-videos">
      <h2>My YouTube Videos</h2>
      <div className="yt-grid">
        {videos.map((item) => {
          const { title, thumbnails, resourceId, publishedAt } =
            item.snippet
          const videoId = resourceId.videoId
          return (
            <a
              key={item.id}
              className="yt-card"
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={thumbnails.medium?.url || thumbnails.default?.url}
                alt={title}
                className="yt-thumb"
              />
              <div className="yt-info">
                <h3>{title}</h3>
                <time dateTime={publishedAt}>
                  {new Date(publishedAt).toLocaleDateString()}
                </time>
              </div>
            </a>
          )
        })}
      </div>
      {hasMore && (
        <button
          className="yt-load-more"
          onClick={() => fetchVideos(pageToken)}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
