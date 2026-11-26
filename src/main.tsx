import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { isNativePlatform } from './native'
import './styles/fonts.css'
import './index.css'

if (!isNativePlatform() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
