import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const WSContext = createContext(null);

export function WebSocketProvider({ children, port = 8080 }) {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);

  // Ref para el último mensaje para debugging
  const lastMessageRef = useRef(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname || 'localhost';
    const url = `${protocol}://${host}:${port}`;

    let websocket;
    try {
      websocket = new WebSocket(url);
    } catch (err) {
      console.error('WebSocket constructor failed for', url, err);
      return;
    }

    websocket.onopen = () => {
      console.log('✓ Conectado al servidor', url);
      setWs(websocket);
      wsRef.current = websocket;
      setConnected(true);
    };

    websocket.onerror = (error) => {
      console.error('❌ Error WebSocket:', url, error);
    };

    // Handler estable que usa refs
    const handleMessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[WebSocketProvider] Recibido mensaje:', message.type);
        console.log('[WebSocketProvider] lastMessage anterior:', lastMessageRef.current);
        
        // Actualizar refs y estado
        lastMessageRef.current = message;
        setLastMessage(message);
        
        console.log('[WebSocketProvider] Estado actualizado con:', message);
      } catch (e) {
        console.warn('Invalid WS message', e);
      }
    };

    websocket.onmessage = handleMessage;

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
  }, [port]);

  const send = (obj) => {
    const socket = wsRef.current || ws;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not open, cannot send', obj);
      return false;
    }
    socket.send(JSON.stringify(obj));
    return true;
  };

  return (
    <WSContext.Provider value={{ ws, connected, lastMessage, send }}>
      {children}
    </WSContext.Provider>
  );
}

export function useWebSocket() {
  const ctx = useContext(WSContext);
  if (!ctx) {
    // For backward compatibility, return a minimal API that mirrors old behavior
    // (returns null ws). Users should wrap app with WebSocketProvider.
    return { ws: null, connected: false, lastMessage: null, send: () => false };
  }
  return ctx;
}
