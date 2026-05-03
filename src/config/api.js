// Centralized API configuration
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const API = {
  BASE: API_BASE,
  AUTH: `${API_BASE}/api/auth`,
  MYCARDS: `${API_BASE}/api/mycards`,
  ANALYSIS: `${API_BASE}/api/analysis`,
  PT: `${API_BASE}/api/pt`,
  
  // Helper to build database-specific URLs
  db: (db, table, endpoint) => `${API_BASE}/api/${db}/${endpoint}/${table}`,
}

export default API
