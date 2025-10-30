export default function Lobby({ pin, players, onStartGame }) {
  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h1 className="lobby-heading">PIN del Juego</h1>
        <div className="lobby-pin">{pin}</div>
        
        <div className="lobby-players-section">
          <h2 className="lobby-players-title">
            Jugadores Conectados: {players.length}
          </h2>
          <div className="lobby-players-grid">
            {players.map((player, i) => (
              <div key={i} className="player-badge">
                {player}
              </div>
            ))}
          </div>
        </div>
        
        <button
          onClick={onStartGame}
          disabled={players.length === 0}
          className="btn-primary"
        >
          Iniciar Juego
        </button>
      </div>
    </div>
  );
}