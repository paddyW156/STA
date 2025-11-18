import { useState, useEffect, useRef } from 'react';

//ESTADO GLOBAL DEL JUEGO

export function useGameState(ws, setScreen, role) {
  const [pin, setPin] = useState(''); //PIN del juego actual
  const [username, setUsername] = useState('');//Nombre del jugador
  const [players, setPlayers] = useState([]);//Jugadores en la partida
  const [currentQuestion, setCurrentQuestion] = useState(null);//Pregunta actual
  const [questionIndex, setQuestionIndex] = useState(0);//Índice de la pregunta actual
  const [totalQuestions, setTotalQuestions] = useState(0);//Total de preguntas en el juego
  const [timeLeft, setTimeLeft] = useState(20);//Tiempo restante para responder
  const [selectedAnswer, setSelectedAnswer] = useState(null);//Respuesta seleccionada por el jugador
  const [answerSubmitted, setAnswerSubmitted] = useState(false);//Si el jugador ha enviado su respuesta
  const [scores, setScores] = useState({});//Puntuaciones de los jugadores
  const [correctAnswer, setCorrectAnswer] = useState(null);//Respuesta correcta de la pregunta actual
  const [answerStats, setAnswerStats] = useState([0, 0, 0, 0]);//Estadísticas de respuestas (número de jugadores que eligieron cada opción)
  const [pointsThisQuestion, setPointsThisQuestion] = useState({});//Puntos obtenidos por jugador en la pregunta actual
  const [showResults, setShowResults] = useState(false);//Si se deben mostrar los resultados de la pregunta
  const [finalScores, setFinalScores] = useState([]);//Puntuaciones finales al terminar el juego
  const [answeredPlayers, setAnsweredPlayers] = useState([]);//Jugadores que han respondido la pregunta actual

  const questionStartTime = useRef(null);//Marca de tiempo cuando comenzó la pregunta, no necesita re-renderizarse
  const timerInterval = useRef(null);//Referencia al intervalo del temporizador
  //Se usa useRef para almacenar valores que no necesitan causar re-renders, react no se entera de los cambios en useRef

  useEffect(() => {//Si se cambia el WebSocket, la pantalla o el rol, configuramos los listeners
    //Se usa useEffect para configurar listeners y manejar mensajes entrantes del servidor
    if (!ws) return;

    const handleMessage = (event) => {//Ha llegado un mensaje del servidor
      const message = JSON.parse(event.data); //PArseamos el mensaje JSON
      console.log('🎮 [GameState] Mensaje recibido:', message.type);

      switch (message.type) {
        //Según el tipo de mensaje, actualizamos el estado del juego

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

    ws.addEventListener('message', handleMessage);//Cada vez que llega un mensaje, se llama a handleMessage

    return () => {
      // Limpiar el listener al desmontar
      ws.removeEventListener('message', handleMessage);
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [ws, setScreen, role]);

  // useRef para evitar re-renders innecesarios en componentes que usan timeLeft
  const timeLeftRef = useRef(null);

  const startTimer = (duration) => { //Durtion son los segundos para la pregunta
    if (timerInterval.current) clearInterval(timerInterval.current); //Limpiamos cualquier temporizador previo

    let timeRemaining = duration;
    timeLeftRef.current = timeRemaining;
    setTimeLeft(timeRemaining);

    timerInterval.current = setInterval(() => {
      timeRemaining -= 1;
      timeLeftRef.current = timeRemaining;
      
      // Actualizar el estado solo cada segundo (no cada tick)
      setTimeLeft(timeRemaining); //Actualiza UI

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

  //Devolvemos el estado y las funciones para manejar el juego
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
