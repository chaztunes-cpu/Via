import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { DataProvider } from './data/DataProvider.jsx';
import './index.css';

// The shareable preview build is hosted as static files, so it routes on the URL hash.
const Router = import.meta.env.MODE === 'preview-link' ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <DataProvider>
        <App />
      </DataProvider>
    </Router>
  </StrictMode>,
);
