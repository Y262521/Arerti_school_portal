import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4500,
              style: { maxWidth: '520px', fontSize: '14px' },
              success: {
                duration: 3500,
                style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
              },
              error: {
                duration: 6000,
                style: {
                  background: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                  fontWeight: '500',
                  padding: '14px 18px',
                },
                iconTheme: { primary: '#dc2626', secondary: '#fff' },
              },
            }}
          />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// Register the service worker only in production builds — in dev it would
// fight with Vite's own module reloading.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err)
    })
  })
}
