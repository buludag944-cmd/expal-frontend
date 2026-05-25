import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import { applyTheme, getInitialTheme } from './components/ThemeToggle';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initCapacitorNative } from './native/capacitorInit';

applyTheme(getInitialTheme());
initCapacitorNative();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
