import { useState, useEffect, useRef, useCallback } from 'react'
import './YouTubeVideos.css'

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY
const CHANNEL_HANDLE = 'shrutikapoor08'
const PAGE_SIZE = 24

const MISSING_KEY_MSG =
  'Missing VITE_YOUTUBE_API_KEY. Add it to a .env file at the project root.'

export default function YouTubeVideos() {
  // Lazy initializers so no synchronous setState fires from effects
  const [videos, setVideos] = useState([])
  const [status, setStatus] = useState(() => (API_KEY ? 'loading' : 'error'))
  const [error, setError] = useState(() => (API_KEY ? null : MISSING_KEY_MSG))
  const [activeIdx, setActiveIdx] = useState(0)

  const playlistIdRef = useRef(null)
  const nextPageTokenRef = useRef(null)
  const seenIdsRef = useRef(new Set())
  const inFlightRef = useRef(false)
  const sentinelRef = useRef(null)
  const gridRef = useRef(null)

  const fetchPage = useCallback(async () => {
    // API_KEY absence is handled by initial state; no sync setState before first await
    if (inFlightRef.current || !API_KEY) return

    inFlightRef.current = true

    try {
      if (!playlistIdRef.current) {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?forHandle=${CHANNEL_HANDLE}&part=contentDetails&key=${API_KEY}`
        )
        if (!res.ok) throw new Error(`Channel lookup failed: ${res.status}`)
        const data = await res.json()
        const id = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
        if (!id) throw new Error('Could not find uploads playlist')
        playlistIdRef.current = id
      }

      let url = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${playlistIdRef.current}&part=snippet&maxResults=${PAGE_SIZE}&key=${API_KEY}`
      if (nextPageTokenRef.current) url += `&pageToken=${nextPageTokenRef.current}`

      const res = await fetch(url)
      if (!res.ok) throw new Error(`Videos fetch failed: ${res.status}`)
      const data = await res.json()

      const newVideos = (data.items ?? []).filter((item) => {
        const vid = item.snippet?.resourceId?.videoId
        if (!vid || seenIdsRef.current.has(vid)) return false
        seenIdsRef.current.add(vid)
        return true
      })

      setVideos((prev) => [...prev, ...newVideos])
      nextPageTokenRef.current = data.nextPageToken ?? null
      setStatus(data.nextPageToken ? 'idle' : 'done')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    } finally {
      inFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    fetchPage()
  }, [fetchPage])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && nextPageTokenRef.current && !inFlightRef.current) {
          setStatus('loading') // safe: fires asynchronously in observer callback
          fetchPage()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchPage])

  const handleGridKeyDown = useCallback(
    (e) => {
      const cards = Array.from(gridRef.current?.querySelectorAll('.yt-card') ?? [])
      if (cards.length === 0) return

      let next

      if (e.key === 'ArrowRight') {
        next = Math.min(activeIdx + 1, cards.length - 1)
      } else if (e.key === 'ArrowLeft') {
        next = Math.max(activeIdx - 1, 0)
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const firstTop = cards[0].offsetTop
        const cols = cards.filter((c) => c.offsetTop === firstTop).length
        next =
          e.key === 'ArrowDown'
            ? Math.min(activeIdx + cols, cards.length - 1)
            : Math.max(activeIdx - cols, 0)
      } else if (e.key === 'Home') {
        next = 0
      } else if (e.key === 'End') {
        next = cards.length - 1
      } else {
        return
      }

      e.preventDefault()
      setActiveIdx(next)
      cards[next]?.focus()
      cards[next]?.scrollIntoView({ block: 'nearest' })
    },
    [activeIdx]
  )

  if (status === 'error') {
    return (
      <div className="yt-videos">
        <h2>My YouTube Videos</h2>
        <p className="yt-error">{error}</p>
      </div>
    )
  }

  if (status === 'loading' && videos.length === 0) {
    return (
      <div className="yt-videos">
        <h2>My YouTube Videos</h2>
        <p className="yt-status" aria-live="polite">Loading videos…</p>
      </div>
    )
  }

  return (
    <div className="yt-videos">
      <h2>My YouTube Videos</h2>
      <div
        ref={gridRef}
        className="yt-grid"
        role="grid"
        aria-label="YouTube videos"
        onKeyDown={handleGridKeyDown}
      >
        {videos.map((item, idx) => {
          const { title, thumbnails, resourceId, publishedAt } = item.snippet
          const videoId = resourceId.videoId
          return (
            <a
              key={videoId}
              className="yt-card"
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              role="gridcell"
              tabIndex={idx === activeIdx ? 0 : -1}
              onFocus={() => setActiveIdx(idx)}
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
      <div ref={sentinelRef} aria-hidden="true" />
      <p className="yt-status" aria-live="polite">
        {status === 'loading' && 'Loading more…'}
        {status === 'done' && videos.length > 0 && `All ${videos.length} videos loaded`}
      </p>
    </div>
  )
}
