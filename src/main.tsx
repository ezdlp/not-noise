import { createRoot } from 'react-dom/client';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import './index.css';
import { useLocation, BrowserRouter as Router } from 'react-router-dom';

const Root = () => {
  const location = useLocation();
  const shouldTrack = !location.pathname.includes('/link/');

  return (
    <>
      <App />
      <SpeedInsights />
      {shouldTrack && <Analytics />}
    </>
  );
};

createRoot(document.getElementById('root')!).render(
  <Router>
    <Root />
  </Router>
);