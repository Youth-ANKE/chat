import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './lib/i18n'
import { syncLanguageFromSettings } from './lib/i18n'
import './index.css'
import App from './App'

// Sync language from settings store on init
const stored = localStorage.getItem('deepseek_settings_v2');
if (stored) {
  try {
    const parsed = JSON.parse(stored);
    if (parsed.language) {
      syncLanguageFromSettings(parsed.language);
    }
  } catch { /* ignore */ }
}

// Register PWA service worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // Service worker registration failed - non-critical
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
