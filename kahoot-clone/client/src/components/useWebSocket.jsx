import { useState, useEffect, useRef } from 'react';

export function useWebSocket() {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    // Decide protocol depending on page (ws for http, wss for https)
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    // Fallback to localhost if hostname is empty (e.g., file://)
    const host = window.location.hostname || 'localhost';
    const port = 8080; // change here if your server listens on another port
    const url = `${protocol}://${host}:${port}`;

    let websocket;
    try {
      websocket = new WebSocket(url);
    } catch (err) {
      console.error('WebSocket constructor failed for', url, err);
      return; // don't try to set handlers if constructor throws
    }

    websocket.onopen = () => {
      console.log('✓ Conectado al servidor', url);
      setWs(websocket);
      wsRef.current = websocket;
      setConnected(true);
    };

    websocket.onerror = (error) => {
      // Log error but avoid blocking alerts in the hook
      console.error('❌ Error WebSocket:', url, error);
    };

    websocket.onclose = (ev) => {
      console.log('✗ Desconectado del servidor', url, ev && ev.code);
      setConnected(false);
      setWs(null);
      wsRef.current = null;
    };

    return () => {
      try {
        websocket && websocket.close();
      } catch (e) {
        console.warn('Error closing websocket', e);
      }
    };
  }, []);

  // Return the WebSocket instance (or null). If you need connected state you
  // can extend this hook to return { ws, connected, send }.
  return ws;
}