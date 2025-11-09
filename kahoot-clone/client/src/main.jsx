import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { WebSocketProvider } from './components/WebSocketProvider';
import { GoogleOAuthProvider } from '@react-oauth/google';


ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="684430860571-th5lonrur7rotvr8tr4b52av00qtjigh.apps.googleusercontent.com">
    <React.StrictMode>
      <WebSocketProvider>
        <App />
      </WebSocketProvider>
    </React.StrictMode>
  </GoogleOAuthProvider>
);
