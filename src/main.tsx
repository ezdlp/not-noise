
import { createRoot } from 'react-dom/client'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import App from './App.tsx'
import './index.css'

// Check if the current pathname starts with "/link/"
const shouldTrackAnalytics = !window.location.pathname.startsWith('/link/');

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <SpeedInsights />
    {shouldTrackAnalytics && <Analytics />}
  </>
);
