//import '../styles/FinalResults.css';

export default function FinalResults({ finalScores, onPlayAgain }) {
  return (
    <div className="dashboard-container">
      <div className="results-card">
        <h1 className="results-title">Resultados Finales</h1>
        
        <div className="results-list">
          {finalScores
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div key={index} className="results-item">
                <span className="player-name">{player.username}</span>
                <span className="player-score">{player.score} pts</span>
              </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={onPlayAgain}>
          Salir
        </button>
      </div>
    </div>
  );
}
