import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Import React Query
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from './components/common/ErrorBoundary';

// Create a client with optimized caching settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
      cacheTime: 1000 * 60 * 30, // Cache will be garbage collected after 30 minutes
      retry: 1, // Only retry failed requests once
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff with max of 30s
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* Wrap App with Provider */}
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Register service worker for PWA offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => console.log('Service worker registered:', reg))
      .catch((err) =>
        console.error('Service worker registration failed:', err)
      );
  });
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// Enable detailed performance monitoring
reportWebVitals((metric) => {
  // Send metrics to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(metric);
  }
  // In production would send to analytics service
});

// Add additional performance optimizations
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  // Register service worker only in production
  window.addEventListener('load', () => {
    // Lazy load non-critical resources
    setTimeout(() => {
      const nonCriticalStyles = document.querySelectorAll(
        'link[data-non-critical="true"]'
      );
      nonCriticalStyles.forEach((link) => {
        (link as HTMLLinkElement).media = 'all';
      });
    }, 1000); // Delay for 1 second after load
  });
}
