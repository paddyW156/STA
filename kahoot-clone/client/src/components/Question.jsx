import { useEffect } from 'react';

export default function Question({
  role,
  currentQuestion,
  questionIndex,
  totalQuestions,
  timeLeft,
  selectedAnswer,
  answerSubmitted,
  showResults,
  correctAnswer,
  scores,
  username,
  players,
  answeredPlayers,
  answerStats,
  pointsThisQuestion,
  onSubmitAnswer,
  onNextQuestion
}) {
  // Debug: ver qué props llegan al componente (solo cuando cambian props importantes)
  useEffect(() => {
    console.log('🎯 Question props actualizadas:', {
      role,
      questionIndex,
      totalQuestions,
      currentQuestion,
      players: players?.length,
      answeredPlayers: answeredPlayers?.length,
      showResults
    });
  }, [role, questionIndex, totalQuestions, currentQuestion, players?.length, answeredPlayers?.length, showResults]);

  // Mostrar resultados cuando todos hayan respondido o se acabe el tiempo
  const allAnswered = players?.length > 0 && answeredPlayers?.length === players?.length;
  const timeExpired = timeLeft <= 0;
  const shouldShowResults = showResults || allAnswered || timeExpired;

  // Efecto para auto-mostrar resultados
  useEffect(() => {
    if ((allAnswered || timeExpired) && !showResults) {
      // Aquí podríamos enviar un mensaje al servidor para mostrar resultados
      console.log('🎯 Todos respondieron o tiempo expirado');
    }
  }, [allAnswered, timeExpired, showResults]);

  if (!currentQuestion) return <div>Cargando pregunta...</div>;

  // Vista del host
  if (role === 'host') {
    return (
      <div className="dashboard-container">
        <div className="question-card">
          <div className="question-status">
            <h2 className="question-header">
              Pregunta {questionIndex + 1} de {totalQuestions}
            </h2>
            <div className="question-timer">
              Tiempo restante: {timeLeft}s
            </div>
          </div>

          {/* Mostrar el texto de la pregunta también para el host */}
          <h3 className="question-text">{currentQuestion.question}</h3>

          <div className="host-progress">
            <h3>Respuestas recibidas:</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(answeredPlayers.length / players.length) * 100}%` }}
              />
            </div>
            <p>{answeredPlayers.length} de {players.length} jugadores</p>
            
            {answeredPlayers.map(player => (
              <span key={player} className="player-badge">{player}</span>
            ))}
          </div>

          {shouldShowResults && (
            <div className="question-results">
              <h3>Resultados:</h3>
              <div className="options-grid">
                {currentQuestion.options.map((opt, index) => (
                  <div 
                    key={index}
                    className={`option-result ${correctAnswer === index ? 'correct' : ''}`}
                  >
                    <span className="option-text">{opt}</span>
                    <span className="answer-count">
                      {Array.isArray(answerStats) && typeof answerStats[index] === 'number'
                        ? `${answerStats[index]} respuestas`
                        : `${answeredPlayers.filter(p => scores[p]?.lastAnswer === index).length} respuestas`}
                    </span>
                    {pointsThisQuestion && pointsThisQuestion.username && null}
                  </div>
                ))}
              </div>
              
              {questionIndex < totalQuestions - 1 ? (
                <button 
                  className="btn-next"
                  onClick={onNextQuestion}
                >
                  Siguiente Pregunta
                </button>
              ) : (
                <button 
                  className="btn-finish"
                  onClick={onNextQuestion}
                >
                  Ver Resultados Finales
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista del jugador
  return (
    <div className="dashboard-container">
      <div className="question-card">
        <div className="question-status">
          <h2 className="question-header">
            Pregunta {questionIndex + 1} de {totalQuestions}
          </h2>
          <div className="question-timer">
            Tiempo restante: {timeLeft}s
          </div>
        </div>

        <h3 className="question-text">{currentQuestion.question}</h3>
        
        <div className="question-options">
          {currentQuestion.options.map((opt, index) => {
            let optionClass = 'option-btn';
            if (selectedAnswer === index) optionClass += ' selected';
            if (shouldShowResults) {
              if (correctAnswer === index) optionClass += ' correct';
              if (selectedAnswer === index && selectedAnswer !== correctAnswer) {
                optionClass += ' incorrect';
              }
            }

            return (
              <button
                key={index}
                className={optionClass}
                disabled={answerSubmitted || shouldShowResults}
                onClick={() => onSubmitAnswer(index)}
              >
                {opt}
                {shouldShowResults && (
                  <span className="answer-feedback">
                    {correctAnswer === index ? '✓' : 
                     selectedAnswer === index ? '✗' : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {shouldShowResults && (
          <div className="answer-feedback">
            {selectedAnswer === correctAnswer ? (
              <p className="feedback correct">¡Respuesta correcta! 🎉</p>
            ) : (
              <p className="feedback incorrect">
                {selectedAnswer !== null ? 
                  '❌ Respuesta incorrecta' : 
                  '⏰ Se acabó el tiempo'}
              </p>
            )}
          </div>
        )}

        {shouldShowResults && (
          <div className="waiting-next">
            <p>Esperando la siguiente pregunta...</p>
            {allAnswered ? (
              <span>Todos han respondido ✓</span>
            ) : (
              <span>Respondieron {answeredPlayers.length} de {players.length} jugadores</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
