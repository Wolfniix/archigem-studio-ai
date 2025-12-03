import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Simple Error Boundary to catch crashes
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#ff4d4d', backgroundColor: '#121416', height: '100vh', fontFamily: 'sans-serif' }}>
          <h1>Something went wrong.</h1>
          <p>Please reload the page.</p>
          <pre style={{ backgroundColor: '#000', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

const mount = (rootElement: HTMLElement) => {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (e) {
    console.error("Failed to mount React app:", e);
  }
};

const startApp = () => {
  const rootElement = document.getElementById('root');
  
  if (rootElement) {
    mount(rootElement);
  } else {
    // Retry mechanism for environments where DOM might lag slightly (e.g. Vercel optimized builds)
    console.warn("Root element not found immediately. Retrying...");
    let retries = 0;
    const interval = setInterval(() => {
      const el = document.getElementById('root');
      if (el) {
        clearInterval(interval);
        mount(el);
      }
      retries++;
      if (retries > 50) { // Timeout after 5 seconds
        clearInterval(interval);
        console.error("CRITICAL ERROR: Root element 'root' never appeared in the DOM.");
      }
    }, 100);
  }
};

// Ensure DOM is fully loaded before trying to access 'root'
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}