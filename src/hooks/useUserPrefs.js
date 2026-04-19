import { useState } from 'react'

const RECENT_KEY = 'cs_recently_viewed'
const FAVS_KEY = 'cs_favorites'
const MAX_RECENT = 5

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}

export function useUserPrefs() {
  const [recentlyViewed, setRecentlyViewed] = useState(() => load(RECENT_KEY, []))
  const [favorites, setFavorites] = useState(() => load(FAVS_KEY, []))

  function addRecent(sportKey) {
    setRecentlyViewed(prev => {
      const updated = [sportKey, ...prev.filter(k => k !== sportKey)].slice(0, MAX_RECENT)
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
      return updated
    })
  }

  function toggleFavorite(sportKey) {
    setFavorites(prev => {
      const updated = prev.includes(sportKey)
        ? prev.filter(k => k !== sportKey)
        : [...prev, sportKey]
      localStorage.setItem(FAVS_KEY, JSON.stringify(updated))
      return updated
    })
  }

  return { recentlyViewed, favorites, addRecent, toggleFavorite }
}
