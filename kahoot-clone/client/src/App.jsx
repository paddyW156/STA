import { useState, useEffect } from 'react';

//Componentes
import Home from './components/Home';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import QuizCreator from './components/QuizCreator';
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import Question from './components/Question';
import FinalResults from './components/FinalResults';
import { useWebSocket } from './components/WebSocketProvider';
import { useGameState } from './components/useGameState';

export default function App() {
  //screen controla qué vista se muestra
  const [screen, setScreen] = useState('home'); //Empezamos en home
  //user tiene la información del usuario logeado
  const [user, setUser] = useState(null);
  //usuario host o player
  const [role, setRole] = useState(null);
  
  //Iniciar websocket y gameState
  const { ws, send } = useWebSocket();
  const gameState = useGameState(ws, setScreen, role);//Cada render de App crea un gameState nuevo

  useEffect(() => {
    // Verificar si hay usuario guardado en el LocalStorage
    const savedUser = localStorage.getItem('quizUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);//Se ejcuta al montar el componente App

  const handleLogin = (userData) => {
    //Guardar usuario y vamos a la pantalla dashboard
    setUser(userData);
    localStorage.setItem('quizUser', JSON.stringify(userData));
    setScreen('dashboard');
  };

  const handleLogout = () => {
    //Cerramos sesión y volvemos home
    setUser(null);
    localStorage.removeItem('quizUser');
    setScreen('home');
    setRole(null);
  };

  const handleCreateRoom = () => {
    if (!user) {
      setScreen('auth');
    } else {
      setScreen('dashboard');
    }
  };

  const handleStartQuiz = (quiz) => {
    //Crear juego
    if (send) {
      const ok = send({ type: 'CREATE_GAME', payload: { quiz } });
      if (ok) setRole('host');
    } else if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'CREATE_GAME', payload: { quiz } }));
      setRole('host');
    }
  };

  const resetGame = () => {
    gameState.reset();
    setScreen('home');
    setRole(null);
  };

  const renderScreen = () => {
    //Lanzamos cada pantalla
    switch (screen) {//Dependiendo del valor de screen
      case 'home':
        return (
          <Home
            onCreateRoom={handleCreateRoom}
            onJoinGame={(pin, username) => {
              gameState.joinGame(pin, username);
              setRole('player');
            }}
          />
        );

      case 'auth':
        return <Auth onLogin={handleLogin} onBack={() => setScreen('home')} />;

      case 'dashboard':
        return (//Le pasamos las funciones necesarias al dashboard
          //como logout, crear nuevo quiz o seleccionar uno para iniciar
          //porque esas tmbién las gestiona App
          <Dashboard
            user={user}
            onLogout={handleLogout}
            onCreateNew={() => setScreen('creator')}
            onSelectQuiz={handleStartQuiz}
          />
        );

      case 'creator':
        return (
          <QuizCreator
            user={user}
            // Al finalizar desde el creador solo volvemos al dashboard (Guardar y salir)
            onFinish={() => {
              setScreen('dashboard');
            }}
            onBack={() => setScreen('dashboard')}
          />
        );

      case 'lobby':
        return role === 'host' ? (
          <Lobby
            pin={gameState.pin}
            players={gameState.players}
            onStartGame={() => gameState.startGame()}
          />
        ) : null;

      case 'waiting':
        return role === 'player' ? (
          <WaitingRoom
            username={gameState.username}
            players={gameState.players}
          />
        ) : null;

      case 'question':
        return (
          <Question
            role={role}
            currentQuestion={gameState.currentQuestion}
            questionIndex={gameState.questionIndex}
            totalQuestions={gameState.totalQuestions}
            timeLeft={gameState.timeLeft}
            selectedAnswer={gameState.selectedAnswer}
            answerSubmitted={gameState.answerSubmitted}
            showResults={gameState.showResults}
            correctAnswer={gameState.correctAnswer}
            scores={gameState.scores}
            username={gameState.username}
            players={gameState.players}
            answeredPlayers={gameState.answeredPlayers}
            answerStats={gameState.answerStats}
            pointsThisQuestion={gameState.pointsThisQuestion}
            onSubmitAnswer={(index) => gameState.submitAnswer(index)}
            onNextQuestion={() => gameState.nextQuestion()}
          />
        );

      case 'final':
        return (
          <FinalResults
            finalScores={gameState.finalScores}
            onPlayAgain={resetGame}
          />
        );

      default:
        return null;
    }
  };

  return <div className="app">{renderScreen()}</div>;
}