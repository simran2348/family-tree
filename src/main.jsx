import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { startSettingsSync } from './services/storage';
import './styles/index.css';

startSettingsSync();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
