import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Android 설치 프롬프트를 미리 캐치 (InstallBanner에서 사용)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as unknown as Record<string, unknown>).deferredPrompt = e;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch(err => console.warn('SW registration failed:', err));
  });
}
