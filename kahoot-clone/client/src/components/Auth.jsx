import { useState, useEffect } from 'react';
import { useWebSocket } from './WebSocketProvider';
//import '../styles/Auth.css';

export default function Auth({ onLogin, onBack}) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  // Obtener conexión y helpers del provider
  const { ws, send, connected, lastMessage } = useWebSocket();

  // Debug del provider
  useEffect(() => {
    console.log('[Auth] Provider values:', { ws, connected, lastMessage });
  }, [ws, connected, lastMessage]);

  useEffect(() => {
    console.log('🔄 [Auth] Efecto ejecutándose, lastMessage:', lastMessage);
    if (!lastMessage) {
      console.log('⏭️ [Auth] No hay mensaje, saliendo del efecto');
      return;
    }

    console.log('📨 [Auth] Tipo de mensaje:', lastMessage.type);

    if (lastMessage.type === 'LOGIN_SUCCESS' || lastMessage.type === 'REGISTER_SUCCESS') {
      console.log('✅ [Auth] Login exitoso!');
      console.log('📦 [Auth] Payload recibido:', lastMessage.payload);
      console.log('🎯 [Auth] Llamando a onLogin...');
      onLogin(lastMessage.payload);
      console.log('✨ [Auth] onLogin ejecutado');
    }

    if (lastMessage.type === 'AUTH_ERROR') {
      console.warn('❌ [Auth] Error:', lastMessage.payload);
      alert(lastMessage.payload.message);
    }
  }, [lastMessage, onLogin]); // Se ejecuta cuando llega un nuevo mensaje

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!connected) {
      alert('Conexión no establecida. Intenta de nuevo.');
      return;
    }

    console.log('[Auth] Enviando petición de login/registro:', formData);
    const type = isLogin ? 'LOGIN_USER' : 'REGISTER_USER';
    send({
      type,
      payload: formData
    });
    console.log('[Auth] Petición enviada, esperando respuesta...');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
          <button onClick={onBack} className="btn-back">← Volver</button>
        </div>
        <h1 className="auth-title">{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <input type="text" placeholder="Usuario"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            className="auth-input" />

          <input type="password" placeholder="Contraseña"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="auth-input" />

          {!isLogin && (
            <input type="email" placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="auth-input" />
          )}

          <button type="submit" className="btn btn-auth">{isLogin ? 'Entrar' : 'Crear Cuenta'}</button>
        </form>

        <div className="auth-toggle">
          <span>{isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}</span>
          <button onClick={() => setIsLogin(!isLogin)} className="btn-toggle">
            {isLogin ? 'Regístrate' : 'Inicia Sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
