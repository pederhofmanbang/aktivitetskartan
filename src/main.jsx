import React from 'react'
import ReactDOM from 'react-dom/client'
import Dashboard from './Dashboard.jsx'

// Polyfill window.storage for environments without it (Vercel deploy)
if (!window.storage) {
  const store = {}
  window.storage = {
    get: async (key) => {
      const val = localStorage.getItem('hdi_' + key)
      return val !== null ? { value: val } : null
    },
    set: async (key, value) => {
      localStorage.setItem('hdi_' + key, value)
    },
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Dashboard />,
)
