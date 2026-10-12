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
            containerStyle={{
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              transform: 'translate(-50%, -50%)',
              zIndex: 99999999,
              pointerEvents: 'none',
            }}
            toastOptions={{
              duration: 4500,
              style: {
                pointerEvents: 'auto',
                minWidth: '340px',
                maxWidth: '560px',
                padding: '16px 24px',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: '600',
                lineHeight: '1.45',
                textAlign: 'center',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                cursor: 'pointer',
              },
              success: {
                duration: 3500,
                style: {
                  background: '#ffffff',
                  color: '#15803d',
                  border: '2px solid #22c55e',
                  boxShadow: '0 25px 60px -15px rgba(34, 197, 94, 0.35), 0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                },
                iconTheme: { primary: '#16a34a', secondary: '#ffffff' },
              },
              error: {
                duration: 6500,
                style: {
                  background: '#ffffff',
                  color: '#b91c1c',
                  border: '2px solid #ef4444',
                  boxShadow: '0 25px 60px -15px rgba(239, 68, 68, 0.35), 0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                },
                iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
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
