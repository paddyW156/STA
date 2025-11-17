import React from 'react'; //Librería principal de React
import ReactDOM from 'react-dom/client'; //Métodos para renderizar en el DOM
import App from './App'; //Componente principal de la aplicación
import './index.css'; //Estilos globales
import { WebSocketProvider } from './components/WebSocketProvider';//Contexto WebSocket
import { GoogleOAuthProvider } from '@react-oauth/google'; //Provedor de OAuth de Google


ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="684430860571-th5lonrur7rotvr8tr4b52av00qtjigh.apps.googleusercontent.com">
    <React.StrictMode>
      <WebSocketProvider>
        <App />
      </WebSocketProvider>
    </React.StrictMode>
  </GoogleOAuthProvider>
);
