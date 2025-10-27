import { useState, useEffect, useRef } from 'react';

const SAMPLE_QUIZ = {
  title: "Quiz de Cultura General",
  questions: [
    {
      question: "¿Cuál es la capital de Francia?",
      options: ["Londres", "Berlín", "París", "Madrid"],
      correctAnswer: 2,
      timeLimit: 20
    },
    {
      question: "¿En qué año llegó el hombre a la Luna?",
      options: ["1965", "1969", "1972", "1975"],
      correctAnswer: 1,
      timeLimit: 20
    },
    {
      question: "¿Cuál es el planeta más grande del sistema solar?",
      options: ["Saturno", "Júpiter", "Neptuno", "Urano"],
      correctAnswer: 1,
      timeLimit: 20
    },
    {
      question: "¿Quién pintó la Mona Lisa?",
      options: ["Van Gogh", "Picasso", "Da Vinci", "Dalí"],
      correctAnswer: 2,
      timeLimit: 20
    },
    {
      question: "¿Cuántos continentes hay?",
      options: ["5", "6", "7", "8"],
      correctAnswer: 2,
      timeLimit: 15
    }
  ]
};

const COLORS = ['#e21b3c', '#1368ce', '#d89e00', '#26890c'];

export default function App() {
  const [ws, setWs] = useState(null);
  const [screen, setScreen] = useState('home');
  const [role, setRole] = useState(null);
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [scores, setScores] = useState({});
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [finalScores, setFinalScores] = useState([]);
  const [answeredPlayers, setAnsweredPlayers] = useState([]);
  
  const questionStartTime = useRef(null);
  const timerInterval = useRef(null);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:8080');
    
    websocket.onopen = () => {
      console.log('✓ Conectado al servidor');
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('📨 Mensaje recibido:', message.type);

      switch (message.type) {
        case 'GAME_CREATED':
          setPin(message.payload.pin);
          setScreen('lobby');
          break;

        case 'JOIN_SUCCESS':
          setPin(message.payload.pin);
          setUsername(message.payload.username);
          setScreen('waiting');
          break;

        case 'PLAYER_JOINED':
          setPlayers(message.payload.players);
          break;

        case 'GAME_STARTED':
          setCurrentQuestion(message.payload.question);
          setQuestionIndex(message.payload.questionIndex);
          setTotalQuestions(message.payload.total);
          setTimeLeft(message.payload.question.timeLimit);
          setScreen('question');
          setAnswerSubmitted(false);
          setSelectedAnswer(null);
          setShowResults(false);
          setCorrectAnswer(null);
          setAnsweredPlayers([]);
          questionStartTime.current = Date.now();
          startTimer(message.payload.question.timeLimit);
          break;

        case 'QUESTION_START':
          setCurrentQuestion(message.payload.question);
          setQuestionIndex(message.payload.questionIndex);
          setTimeLeft(message.payload.question.timeLimit);
          setScreen('question');
          setAnswerSubmitted(false);
          setSelectedAnswer(null);
          setShowResults(false);
          setCorrectAnswer(null);
          setAnsweredPlayers([]);
          questionStartTime.current = Date.now();
          startTimer(message.payload.question.timeLimit);
          break;

        case 'ANSWER_RECEIVED':
          setAnsweredPlayers(prev => [...prev, message.payload.username]);
          break;

        case 'QUESTION_END':
          setCorrectAnswer(message.payload.correctAnswer);
          setScores(message.payload.scores);
          setShowResults(true);
          if (timerInterval.current) {
            clearInterval(timerInterval.current);
          }
          break;

        case 'GAME_END':
          setFinalScores(message.payload.finalScores);
          setScreen('final');
          if (timerInterval.current) {
            clearInterval(timerInterval.current);
          }
          break;

        case 'ERROR':
          alert(message.payload.message);
          break;
      }
    };

    websocket.onerror = (error) => {
      console.error('❌ Error WebSocket:', error);
      alert('Error de conexión. Asegúrate de que el servidor esté ejecutándose en ws://localhost:8080');
    };

    websocket.onclose = () => {
      console.log('✗ Desconectado del servidor');
    };

    return () => {
      if (websocket) websocket.close();
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, []);

  const startTimer = (duration) => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    
    let timeRemaining = duration;
    timerInterval.current = setInterval(() => {
      timeRemaining -= 1;
      setTimeLeft(timeRemaining);
      
      if (timeRemaining <= 0) {
        clearInterval(timerInterval.current);
      }
    }, 1000);
  };

  const createGame = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'CREATE_GAME',
        payload: { quiz: SAMPLE_QUIZ }
      }));
      setRole('host');
    } else {
      alert('No hay conexión con el servidor. Verifica que esté corriendo.');
    }
  };

  const joinGame = () => {
    if (ws && ws.readyState === WebSocket.OPEN && pin && username) {
      ws.send(JSON.stringify({
        type: 'JOIN_GAME',
        payload: { pin, username }
      }));
      setRole('player');
    } else {
      alert('Por favor completa todos los campos y verifica la conexión.');
    }
  };

  const startGame = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'START_GAME',
        payload: { pin }
      }));
    }
  };

  const submitAnswer = (answerIndex) => {
    if (answerSubmitted || !ws) return;
    
    const timeTaken = Date.now() - questionStartTime.current;
    setSelectedAnswer(answerIndex);
    setAnswerSubmitted(true);

    ws.send(JSON.stringify({
      type: 'SUBMIT_ANSWER',
      payload: {
        pin,
        questionIndex,
        answer: answerIndex,
        timeMs: timeTaken
      }
    }));
  };

  const nextQuestion = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'NEXT_QUESTION',
        payload: { pin }
      }));
    }
  };

  const resetGame = () => {
    setScreen('home');
    setRole(null);
    setPin('');
    setUsername('');
    setPlayers([]);
    setCurrentQuestion(null);
    setQuestionIndex(0);
    setTotalQuestions(0);
    setTimeLeft(20);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setScores({});
    setCorrectAnswer(null);
    setShowResults(false);
    setFinalScores([]);
    setAnsweredPlayers([]);
  };

  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full">
          <h1 className="text-5xl font-bold text-center mb-8 text-purple-600">Kahoot!</h1>
          <div className="space-y-4">
            <button
              onClick={createGame}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-all transform hover:scale-105"
            >
              Crear Juego
            </button>
            <div className="text-center text-gray-500 font-semibold">o</div>
            <input
              type="text"
              placeholder="PIN del juego"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 text-center text-2xl font-bold focus:outline-none focus:border-purple-600"
              maxLength={6}
            />
            <input
              type="text"
              placeholder="Tu nombre"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 text-center text-xl focus:outline-none focus:border-purple-600"
            />
            <button
              onClick={joinGame}
              disabled={!pin || !username}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-xl text-xl transition-all transform hover:scale-105 disabled:transform-none"
            >
              Unirse al Juego
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'lobby' && role === 'host') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-500 to-orange-500 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <h1 className="text-4xl font-bold mb-4">PIN del Juego</h1>
            <div className="text-8xl font-bold text-purple-600 mb-8 tracking-wider">{pin}</div>
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Jugadores Conectados: {players.length}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                {players.map((player, i) => (
                  <div key={i} className="bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold py-3 px-4 rounded-xl">
                    {player}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={startGame}
              disabled={players.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-12 rounded-xl text-2xl transition-all transform hover:scale-105 disabled:transform-none"
            >
              Iniciar Juego
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'waiting' && role === 'player') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-2xl">
          <h1 className="text-5xl font-bold mb-8 text-blue-600">¡Conectado!</h1>
          <p className="text-3xl mb-4">Hola, <span className="font-bold text-purple-600">{username}</span></p>
          <p className="text-xl text-gray-600 mb-8">Esperando a que el host inicie el juego...</p>
          <div className="animate-bounce text-6xl">🎮</div>
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Otros jugadores:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {players.filter(p => p !== username).map((player, i) => (
                <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {player}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-4 flex justify-between items-center">
            <div className="text-xl font-bold">
              Pregunta {questionIndex + 1} de {totalQuestions}
            </div>
            <div className={`text-4xl font-bold ${timeLeft <= 5 ? 'text-red-600 animate-pulse' : 'text-purple-600'}`}>
              {timeLeft}s
            </div>
            {role === 'player' && (
              <div className="text-lg font-semibold text-gray-700">
                {username}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800">
              {currentQuestion.text}
            </h2>
          </div>

          {role === 'player' && !showResults && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => submitAnswer(i)}
                  disabled={answerSubmitted}
                  style={{ backgroundColor: COLORS[i] }}
                  className={`text-white font-bold py-12 rounded-2xl text-2xl transition-all transform hover:scale-105 disabled:opacity-50 ${
                    selectedAnswer === i ? 'ring-8 ring-white' : ''
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {role === 'player' && answerSubmitted && !showResults && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-2xl font-bold text-gray-700">Respuesta enviada!</p>
              <p className="text-xl text-gray-500 mt-2">Esperando resultados...</p>
            </div>
          )}

          {role === 'host' && !showResults && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-4 text-center">
                Esperando respuestas... ({answeredPlayers.length}/{players.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {players.map((player, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg font-semibold text-center ${
                      answeredPlayers.includes(player)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {player} {answeredPlayers.includes(player) && '✓'}
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <button
                  onClick={nextQuestion}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-xl text-xl"
                >
                  Mostrar Resultados
                </button>
              </div>
            </div>
          )}

          {showResults && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-3xl font-bold mb-6 text-center text-green-600">
                  Respuesta Correcta: {currentQuestion.options[correctAnswer]}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((option, i) => (
                    <div
                      key={i}
                      style={{ backgroundColor: i === correctAnswer ? '#10b981' : '#ef4444' }}
                      className={`text-white font-bold py-8 rounded-2xl text-2xl text-center ${
                        selectedAnswer === i ? 'ring-8 ring-yellow-400' : ''
                      }`}
                    >
                      {option}
                      {i === correctAnswer && ' ✓'}
                      {selectedAnswer === i && selectedAnswer !== correctAnswer && ' ✗'}
                    </div>
                  ))}
                </div>

                {role === 'player' && selectedAnswer !== null && (
                  <div className="mt-6 text-center">
                    <p className={`text-3xl font-bold ${selectedAnswer === correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedAnswer === correctAnswer ? '¡Correcto! 🎉' : 'Incorrecto 😢'}
                    </p>
                    {scores[username] !== undefined && (
                      <p className="text-2xl mt-2">
                        Tu puntuación: <span className="font-bold text-purple-600">{scores[username]}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-4 text-center">🏆 Clasificación 🏆</h3>
                <div className="space-y-2">
                  {Object.entries(scores)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([player, score], i) => (
                      <div
                        key={player}
                        className={`flex justify-between items-center p-4 rounded-xl font-bold ${
                          i === 0 ? 'bg-yellow-400 text-yellow-900' :
                          i === 1 ? 'bg-gray-300 text-gray-800' :
                          i === 2 ? 'bg-orange-300 text-orange-900' :
                          'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <span className="text-xl">
                          {i + 1}. {player}
                          {i === 0 && ' 👑'}
                        </span>
                        <span className="text-2xl">{score}</span>
                      </div>
                    ))}
                </div>
              </div>

              {role === 'host' && (
                <div className="text-center">
                  <button
                    onClick={nextQuestion}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-12 rounded-xl text-2xl transition-all transform hover:scale-105"
                  >
                    {questionIndex + 1 < totalQuestions ? 'Siguiente Pregunta' : 'Ver Resultados Finales'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'final') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-12">
            <h1 className="text-5xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              🎊 Resultados Finales 🎊
            </h1>

            {finalScores.length > 0 && (
              <div className="space-y-4 mb-8">
                {finalScores.map((entry, i) => (
                  <div
                    key={entry.username}
                    className={`flex justify-between items-center p-6 rounded-2xl font-bold text-2xl transition-all transform hover:scale-105 ${
                      i === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 shadow-2xl scale-110' :
                      i === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800' :
                      i === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900' :
                      'bg-gradient-to-r from-blue-200 to-blue-300 text-blue-800'
                    }`}
                  >
                    <span className="flex items-center gap-4">
                      <span className={`text-4xl ${i < 3 ? 'animate-bounce' : ''}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                      </span>
                      <span>{entry.username}</span>
                    </span>
                    <span className="text-3xl">{entry.score}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center">
              <button
                onClick={resetGame}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-12 rounded-xl text-2xl transition-all transform hover:scale-105 shadow-lg"
              >
                Jugar de Nuevo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
