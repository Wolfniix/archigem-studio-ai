import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const startApp = () => {
  const rootElement = document.getElementById('root');
  
  // Safety Check: Ensure root element exists before creating root
  if (!rootElement) {
    console.error("CRITICAL ERROR: Could not find root element with id 'root' to mount React application.");
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Ensure DOM is fully loaded before trying to access 'root'
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}