import { useState } from 'react'

export function useLocalStore(key, initial = []) {
  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initial }
    catch { return initial }
  })

  function save(updated) {
    setData(updated)
    localStorage.setItem(key, JSON.stringify(updated))
  }

  function add(item) {
    save([...data, { ...item, id: Date.now() }])
  }

  function update(id, changes) {
    save(data.map(d => d.id === id ? { ...d, ...changes } : d))
  }

  function remove(id) {
    save(data.filter(d => d.id !== id))
  }

  return { data, add, update, remove }
}
