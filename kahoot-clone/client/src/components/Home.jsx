import { useState } from 'react';
//import '../styles/Home.css';

export default function Home({ onCreateRoom, onJoinGame }) {
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');

  const handleJoin = () => {
    if (pin && username) {
      onJoinGame(pin, username);
    } else {
      alert('Por favor completa todos los campos.');
    }
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1 className="home-title">QuizMaster!</h1>
        <div className="home-content">
          <button 
            onClick={onCreateRoom}
            className="btn btn-create">
            Crear Sala
          </button>
          
          <div className="divider">o</div>
          
          <input
            type="text"
            placeholder="PIN del juego"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="input-pin"
            maxLength={6}
          />
          
          <input
            type="text"
            placeholder="Tu nombre"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-username"
          />
          
          <button
            onClick={handleJoin}
            disabled={!pin || !username}
            className="btn btn-join"
          >
            Unirse al Juego
          </button>
        </div>
      </div>
    </div>
  );
}