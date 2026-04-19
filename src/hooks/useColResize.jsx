import { useRef, useCallback } from 'react'

export default function useColResize(initialWidths) {
  const widths = useRef({ ...initialWidths })
  const listeners = useRef({})

  const onMouseDown = useCallback((col, e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = widths.current[col] ?? 120

    function onMove(ev) {
      const newW = Math.max(60, startW + ev.clientX - startX)
      widths.current[col] = newW
      // directly update all th/td with data-col attribute for perf
      document.querySelectorAll(`[data-col="${col}"]`).forEach(el => {
        el.style.width = newW + 'px'
        el.style.minWidth = newW + 'px'
      })
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  function resizeHandle(col) {
    return (
      <div
        className="col-resize-handle"
        onMouseDown={e => onMouseDown(col, e)}
      />
    )
  }

  function colStyle(col) {
    const w = widths.current[col]
    return w ? { width: w, minWidth: w } : {}
  }

  return { resizeHandle, colStyle }
}
