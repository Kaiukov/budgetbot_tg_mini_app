import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApiTest } from './components/ApiTest';
import './index.css';

// Standalone test page
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApiTest />
  </React.StrictMode>
);
