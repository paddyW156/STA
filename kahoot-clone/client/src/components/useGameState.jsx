import { useState, useEffect, useRef } from 'react';

export function useGameState(ws, setScreen, role) {
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
  const [answerStats, setAnswerStats] = useState([0, 0, 0, 0]);
  const [pointsThisQuestion, setPointsThisQuestion] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [finalScores, setFinalScores] = useState([]);
  const [answeredPlayers, setAnsweredPlayers] = useState([]);

  const questionStartTime = useRef(null);
  const timerInterval = useRef(null);

  useEffect(() => {
    if (!ws) return;

    // En lugar de asignar onmessage, agregamos un event listener
    const handleMessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('🎮 [GameState] Mensaje recibido:', message.type);

      switch (message.type) {
        // Handle auth success messages so we can capture username for game flows.
        // Navigation should be handled by App (handleLogin). Here we only store
        // username when available and log the payload for debugging.

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

        case 'GAME_STARTED': {
          console.log('🎮 El juego ha comenzado');
          console.log('📥 Pregunta recibida:', message.payload.question);

          // Solo los jugadores ven la pregunta
          setCurrentQuestion(message.payload.question);
          setQuestionIndex(message.payload.questionIndex);
          setTotalQuestions(message.payload.total);
          setTimeLeft(message.payload.question.timeLimit);
          setAnswerSubmitted(false);
          setSelectedAnswer(null);
          setShowResults(false);
          setCorrectAnswer(null);
          setAnswerStats([0,0,0,0]);
          setPointsThisQuestion({});
          setAnsweredPlayers([]);
          questionStartTime.current = Date.now();
          startTimer(message.payload.question.timeLimit);

          // Tanto el host como los jugadores ven la pantalla de pregunta
          setScreen('question');
          break;
        }

        case 'QUESTION_START': {
          console.log('🆕 Nueva pregunta recibida');

          setCurrentQuestion(message.payload.question);
          setQuestionIndex(message.payload.questionIndex);
          setTotalQuestions(message.payload.total);
          setTimeLeft(message.payload.question.timeLimit);
          setAnswerSubmitted(false);
          setSelectedAnswer(null);
          setShowResults(false);
          setCorrectAnswer(null);
          setAnswerStats([0,0,0,0]);
          setPointsThisQuestion({});
          setAnsweredPlayers([]);
          questionStartTime.current = Date.now();
          startTimer(message.payload.question.timeLimit);

          // Tanto el host como los jugadores ven el componente Question
          setScreen('question');
          break;
        }

        case 'ANSWER_RECEIVED':
          setAnsweredPlayers((prev) => [...prev, message.payload.username]);
          break;

        case 'QUESTION_END':
          setCorrectAnswer(message.payload.correctAnswer);
          setScores(message.payload.scores || {});
          // store answer statistics and per-player points if provided by server
          if (Array.isArray(message.payload.answerStats)) setAnswerStats(message.payload.answerStats);
          if (message.payload.pointsThisQuestion) setPointsThisQuestion(message.payload.pointsThisQuestion);
          setShowResults(true);
          if (timerInterval.current) clearInterval(timerInterval.current);
          break;

        case 'GAME_END':
          setFinalScores(message.payload.finalScores);
          setScreen('final');
          if (timerInterval.current) clearInterval(timerInterval.current);
          break;

        case 'ERROR':
          alert(message.payload.message);
          break;
      }
    };

    // Agregar el listener
    ws.addEventListener('message', handleMessage);

    return () => {
      // Limpiar el listener al desmontar
      ws.removeEventListener('message', handleMessage);
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [ws, setScreen, role]);

  // useRef para evitar re-renders innecesarios en componentes que usan timeLeft
  const timeLeftRef = useRef(null);

  const startTimer = (duration) => {
    if (timerInterval.current) clearInterval(timerInterval.current);

    let timeRemaining = duration;
    timeLeftRef.current = timeRemaining;
    setTimeLeft(timeRemaining);

    timerInterval.current = setInterval(() => {
      timeRemaining -= 1;
      timeLeftRef.current = timeRemaining;
      
      // Actualizar el estado solo cada segundo (no cada tick)
      setTimeLeft(timeRemaining);

      if (timeRemaining <= 0) {
        clearInterval(timerInterval.current);
        // Cuando se acaba el tiempo, notificar al servidor
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'TIME_EXPIRED',
            payload: {
              pin,
              questionIndex
            }
          }));
        }
      }
    }, 1000);
  };

  const joinGame = (gamePin, playerUsername) => {
    if (ws && ws.readyState === WebSocket.OPEN && gamePin && playerUsername) {
      ws.send(JSON.stringify({
        type: 'JOIN_GAME',
        payload: { pin: gamePin, username: playerUsername },
      }));
    } else {
      alert('Por favor completa todos los campos y verifica la conexión.');
    }
  };

  const startGame = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'START_GAME',
        payload: { pin },
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
        timeMs: timeTaken,
      },
    }));
    console.log('📤 Enviando respuesta:', { pin, questionIndex, answerIndex, timeTaken });
  };

  const nextQuestion = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'NEXT_QUESTION',
        payload: { pin },
      }));
    }
  };

  const reset = () => {
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
    if (timerInterval.current) clearInterval(timerInterval.current);
  };

  return {
    pin,
    username,
    players,
    currentQuestion,
    questionIndex,
    totalQuestions,
    timeLeft,
    selectedAnswer,
    answerSubmitted,
    scores,
    correctAnswer,
    showResults,
    answerStats,
    pointsThisQuestion,
    finalScores,
    answeredPlayers,
    joinGame,
    startGame,
    submitAnswer,
    nextQuestion,
    reset,
  };
}
