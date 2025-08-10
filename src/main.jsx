import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './ErrorBoundary';

// Check if root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  // Create a visible error message
  document.body.innerHTML = `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      border: 2px solid #ff4444;
      border-radius: 8px;
      background-color: #ffeeee;
      color: #cc0000;
    ">
      <h1>Error: Root Element Not Found</h1>
      <p>Could not find an element with id="root" to mount the React application.</p>
      <p>Please check your index.html file and ensure it contains a div with id="root".</p>
    </div>
  `;
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
  } catch (error) {
    console.error('Error rendering React app:', error);
    rootElement.innerHTML = `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        border: 2px solid #ff4444;
        border-radius: 8px;
        background-color: #ffeeee;
        color: #cc0000;
      ">
        <h1>Error Rendering React Application</h1>
        <p>${error.message}</p>
        <pre>${error.stack}</pre>
      </div>
    `;
  }
}
