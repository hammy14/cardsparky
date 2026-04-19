import { useEffect, useRef, useState } from 'react'

export default function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const from = prev.current
    const to = Number(target) || 0
    if (from === to) return
    const start = performance.now()
    function tick(now) {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setValue(Math.round(from + (to - from) * ease))
      if (t < 1) requestAnimationFrame(tick)
      else { setValue(to); prev.current = to }
    }
    requestAnimationFrame(tick)
  }, [target, duration])

  return value
}
