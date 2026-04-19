import { useState, useCallback } from 'react'

export default function useLoadingBtn(fn) {
  const [loading, setLoading] = useState(false)
  const run = useCallback(async (...args) => {
    setLoading(true)
    try { return await fn(...args) }
    finally { setLoading(false) }
  }, [fn])
  return [loading, run]
}
