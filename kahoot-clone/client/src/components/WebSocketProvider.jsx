import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const WSContext = createContext(null);
//con este creamos un contexto para compartir la conexión WebSocket con cualquier componente hijo
//es como el "canal" por el que se comunican los componentes con el servidor

export function WebSocketProvider({ children, port = 8080 }) {
  const [ws, setWs] = useState(null);
  //guardamos la conexión WebSocket en el estado
  const [connected, setConnected] = useState(false);
  //estado para saber si estamos conectados
  const [lastMessage, setLastMessage] = useState(null);
  //estado para guardar el último mensaje recibido
  const wsRef = useRef(null);
  //referencia que no provoca re-renders al cambiar
  //wsRef se usa para tener siempre la referencia actual de la conexión WebSocket
  const lastMessageRef = useRef(null);
  //la misma idea, pero para el último mensaje recibido

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname || 'localhost';
    //Calculamos la URL del WebSocket:
    const url = `${protocol}://${host}:${port}`;

    let websocket;
    try {
      websocket = new WebSocket(url); // Crear la conexión WebSocket con el servidor
    } catch (err) {
      console.error('WebSocket constructor failed for', url, err);
      return;
    }

    websocket.onopen = () => {// Cuando la conexión se abre
      console.log('✓ Conectado al servidor', url);
      setWs(websocket);
      wsRef.current = websocket;
      setConnected(true);
    };

    websocket.onerror = (error) => {// Manejo de errores
      console.error('❌ Error WebSocket:', url, error);
    };

    websocket.onmessage = handleMessage;//Recibir mensajes del servidor

    // Handler estable que usa refs
    const handleMessage = (event) => {
      try {
        const message = JSON.parse(event.data); //Parsear el mensaje JSON
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


    websocket.onclose = (ev) => {//Si se cierra la conexión, limpiamos
      console.log('✗ Desconectado del servidor', url, ev && ev.code);
      setConnected(false);
      setWs(null);
      wsRef.current = null;
    };

    return () => { //Es la función de limpieza del useEffect, se ejecuta al desmontar
      try {
        websocket && websocket.close();
      } catch (e) {
        console.warn('Error closing websocket', e);
      }
    };
  }, [port]); //Si se cambia el puerto, se reconecta

  const send = (obj) => {
    const socket = wsRef.current || ws;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not open, cannot send', obj);
      return false;
    }
    socket.send(JSON.stringify(obj));
    return true;
  };

  //value se comparte con todos los componentes dentro del provider
  //todos los componentes hijos pueden acceder a ws, connected, lastMessage y send
  //asi un unico WebSocket se comparte en toda la app
  return (
    <WSContext.Provider value={{ ws, connected, lastMessage, send }}> 
      {children}
    </WSContext.Provider>
  );
}

export function useWebSocket() {
  //const { ws, connected, lastMessage, send } = useWebSocket();
  //Es una funcion que devuelve el contexto del WebSocket
  const ctx = useContext(WSContext);
  if (!ctx) {
    // For backward compatibility, return a minimal API that mirrors old behavior
    // (returns null ws). Users should wrap app with WebSocketProvider.
    return { ws: null, connected: false, lastMessage: null, send: () => false };
  }
  return ctx;
}
