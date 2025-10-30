//import '../styles/WaitingRoom.css';

export default function WaitingRoom({ username, players }) {
  return (
    <div className="waitingroom-container">
      <div className="waitingroom-card">
        <h1 className="waitingroom-title">Esperando al anfitrión...</h1>
        <p className="waitingroom-subtitle">Tu nombre: <strong>{username}</strong></p>

        <h2 className="waitingroom-players-title">
          Jugadores conectados: {players.length}
        </h2>

        <div className="waitingroom-players-grid">
          {players.map((player, i) => (
            <div key={i} className="player-badge">
              {player}
            </div>
          ))}
        </div>

        <p className="waitingroom-note">El juego comenzará pronto...</p>
      </div>
    </div>
  );
}
