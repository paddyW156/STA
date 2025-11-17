import { useState, useEffect } from 'react';
import { useWebSocket } from './WebSocketProvider';
import { GoogleLogin } from '@react-oauth/google';

import '../styles/App.css';

export default function Auth({ onLogin, onBack}) {
  const [isLogin, setIsLogin] = useState(true);//Controla si es login o registro
  const [formData, setFormData] = useState({//Datos del formulario, si cambian, se re-renderiza
    username: '',
    email: '',
    password: ''
  });

  // Obtener conexión y helpers del provider
  const { ws, send, connected, lastMessage } = useWebSocket();

  // Debug del provider
  /*
  useEffect(() => {
    console.log('[Auth] Provider values:', { ws, connected, lastMessage });
  }, [ws, connected, lastMessage]);
  */

  useEffect(() => {// Se ejecuta cuando llega un nuevo mensaje
    console.log('🔄 [Auth] Efecto ejecutándose, lastMessage:', lastMessage);
    if (!lastMessage) {
      console.log('⏭️ [Auth] No hay mensaje, saliendo del efecto');
      return;
    }

    console.log('📨 [Auth] Tipo de mensaje:', lastMessage.type);

    if (lastMessage.type === 'LOGIN_SUCCESS' || lastMessage.type === 'REGISTER_SUCCESS') {
      /*
      console.log('✅ [Auth] Login exitoso!');
      console.log('📦 [Auth] Payload recibido:', lastMessage.payload);
      console.log('🎯 [Auth] Llamando a onLogin...');
      */
      onLogin(lastMessage.payload); //hay login exitoso, llamamos a onLogin
      //console.log('✨ [Auth] onLogin ejecutado');
    }

    if (lastMessage.type === 'AUTH_ERROR') {
      //console.warn('❌ [Auth] Error:', lastMessage.payload);
      alert(lastMessage.payload.message);
    }
  }, [lastMessage, onLogin]); 

  const handleSubmit = (e) => {
    e.preventDefault();//Prevenir recarga de página

    if (!connected) {
      alert('Conexión no establecida. Intenta de nuevo.');
      return;
    }

    console.log('[Auth] Enviando petición de login/registro:', formData);
    const type = isLogin ? 'LOGIN_USER' : 'REGISTER_USER';
    send({ //Enviar petición al servidor
      type,
      payload: formData
    });
    console.log('[Auth] Petición enviada, esperando respuesta...');
  };

  //Manejo de login con Google
  const handleGoogleLoginSuccess = (credentialResponse) => {
    console.log('[Auth] Google login exitoso:', credentialResponse);
    if (!connected) {
      alert('Conexión no establecida. Intenta de nuevo.');
      return;
    }
    // El servidor espera `idToken` en el payload (ver server/server.js)
    send({
      type: 'LOGIN_GOOGLE',
      payload: { idToken: credentialResponse.credential }
    });
  };

  const handleGoogleLoginError = () => {
    console.error('[Auth] Error en login con Google');
    alert('Error en login con Google. Intenta de nuevo.');
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
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}//Sobreescribir username
            required
            className="auth-input" />

          <input type="password" placeholder="Contraseña"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}//Sobreescribir password
            required
            className="auth-input" />

          {!isLogin && (
            <input type="email" placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}//Sobreescribir email
              required
              className="auth-input" />
          )}

          <button type="submit" className="btn btn-auth">{isLogin ? 'Entrar' : 'Crear Cuenta'}</button>
        </form>

        <div className="auth-social-login">
          <p className="auth-social-text">o continúa con</p>
          <div className="auth-social-buttons">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={handleGoogleLoginError}
            />
          </div>
        </div>

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
