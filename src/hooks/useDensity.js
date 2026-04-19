import { useState } from 'react'

const KEY = 'cs_table_density'
const OPTIONS = ['compact', 'comfortable', 'spacious']

export default function useDensity() {
  const [density, setDensity] = useState(() => localStorage.getItem(KEY) || 'comfortable')
  function set(d) { setDensity(d); localStorage.setItem(KEY, d) }
  return [density, set, OPTIONS]
}
