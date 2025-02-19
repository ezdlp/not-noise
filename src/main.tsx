
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Lazy load the main App component
const App = React.lazy(() => import('./App'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
  </div>
);

// Initialize the app with performance optimizations
const initApp = () => {
  const root = document.getElementById('root');
  if (!root) return;

  // Add performance marks for monitoring
  performance.mark('app-init-start');

  createRoot(root).render(
    <React.StrictMode>
      <Suspense fallback={<LoadingFallback />}>
        <App />
      </Suspense>
    </React.StrictMode>
  );

  // Mark app initialization complete
  performance.mark('app-init-end');
  performance.measure('app-initialization', 'app-init-start', 'app-init-end');
};

// Initialize app with error boundary
try {
  initApp();
} catch (error) {
  console.error('Failed to initialize app:', error);
  // Here you could render a fallback error UI
}

// Register service worker for asset caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}

// Add performance monitoring
if (process.env.NODE_ENV === 'production') {
  // Report performance metrics
  const reportWebVitals = async (metric: any) => {
    // You can send metrics to your analytics service here
    console.log(metric);
  };

  // Monitor Core Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(reportWebVitals);
    getFID(reportWebVitals);
    getFCP(reportWebVitals);
    getLCP(reportWebVitals);
    getTTFB(reportWebVitals);
  });
}

