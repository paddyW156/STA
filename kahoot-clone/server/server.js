const WebSocket = require('ws');
const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');

// === Archivo de usuarios ===
const USERS_FILE = path.join(__dirname, 'users.json');
function loadUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// === Archivo de quizzes ===
const QUIZZES_FILE = path.join(__dirname, 'quizzes.json');
function loadQuizzes() {
  try {
    const data = fs.readFileSync(QUIZZES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function saveQuizzes(quizzes) {
  fs.writeFileSync(QUIZZES_FILE, JSON.stringify(quizzes, null, 2), 'utf8');
}

  function deleteQuiz(user, quizTitle) {
    const quizzes = loadQuizzes();
    const initialLength = quizzes.length;
    const filteredQuizzes = quizzes.filter(q => !(q.user === user && q.title === quizTitle));
  
    if (filteredQuizzes.length === initialLength) {
      return false; // No quiz was deleted
    }
  
    saveQuizzes(filteredQuizzes);
    return true;
  }

function appendQuiz(entry) {
  const arr = loadQuizzes();
  arr.push(entry);
  saveQuizzes(arr);
}

// === Obtener IP local ===
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();
const server = http.createServer();
const wss = new WebSocket.Server({ server });

const games = new Map();

function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function broadcastToGame(pin, message, excludeWs = null) {
  const game = games.get(pin);
  if (!game) return;
  game.clients.forEach(client => {
    if (client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

function checkAllAnswered(game) {
  const playerCount = game.clients.filter(c => !c.isHost).length;
  const answeredCount = Object.keys(game.answers[game.currentQuestion] || {}).length;
  return playerCount > 0 && answeredCount === playerCount;
}

function calculateAnswerStats(game) {
  const answers = game.answers[game.currentQuestion] || {};
  const stats = [0, 0, 0, 0];
  Object.values(answers).forEach(a => stats[a.answer]++);
  return stats;
}

function showQuestionResults(pin) {
  const game = games.get(pin);
  if (!game) return;

  const prevQuestion = game.quiz.questions[game.currentQuestion];
  const answerStats = calculateAnswerStats(game);

  const pointsThisQuestion = {};
  const answers = game.answers[game.currentQuestion] || {};
  game.clients.filter(c => !c.isHost).forEach(client => {
    const answer = answers[client.username];
    pointsThisQuestion[client.username] = answer ? answer.points : 0;
  });

  broadcastToGame(pin, {
    type: 'QUESTION_END',
    payload: {
      correctAnswer: prevQuestion.correctAnswer,
      scores: game.scores,
      answerStats,
      pointsThisQuestion
    }
  });

  setTimeout(() => {
    game.currentQuestion++;
    if (game.currentQuestion >= game.quiz.questions.length) {
      game.state = 'FINISHED';
      const rankings = Object.entries(game.scores)
        .sort(([, a], [, b]) => b - a)
        .map(([username, score], i) => ({
          rank: i + 1,
          username,
          score
        }));
      broadcastToGame(pin, {
        type: 'GAME_END',
        payload: { finalScores: rankings }
      });
    } else {
      const question = game.quiz.questions[game.currentQuestion];
      game.answers[game.currentQuestion] = {};
      // Normalize question before sending to clients (handle legacy 'text' field)
      const questionToSend = {
        question: question.question || question.text || question.prompt || '',
        options: Array.isArray(question.options) ? question.options : [],
        timeLimit: question.timeLimit || 20,
        correctAnswer: typeof question.correctAnswer === 'number' ? question.correctAnswer : null
      };
      console.log('📤 Enviando siguiente pregunta (normalizada):', questionToSend);
      broadcastToGame(pin, {
        type: 'QUESTION_START',
        payload: {
          question: questionToSend,
          questionIndex: game.currentQuestion,
          total: game.quiz.questions.length
        }
      });
    }
  }, 5000);
}

wss.on('connection', (ws) => {
  console.log('✓ Nueva conexión WebSocket');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      switch (message.type) {

        // 📌 REGISTRO DE USUARIO
        case 'REGISTER_USER': {
          const { username, email, password } = message.payload;
          const users = loadUsers();

          if (users.find(u => u.username === username)) {
            ws.send(JSON.stringify({
              type: 'AUTH_ERROR',
              payload: { message: 'El usuario ya existe' }
            }));
            break;
          }

          const newUser = { username, email, password, quizzes: [] };
          users.push(newUser);
          saveUsers(users);

          ws.send(JSON.stringify({
            type: 'REGISTER_SUCCESS',
            payload: { username, email }
          }));
          console.log(`🟢 Usuario registrado: ${username}`);
          break;
        }

        // 📌 LOGIN DE USUARIO
        case 'LOGIN_USER': {
          const { username, password } = message.payload;
          const users = loadUsers();
          const user = users.find(u => u.username === username && u.password === password);

          if (user) {
            // Ensure we return the quizzes stored in quizzes.json (single source of truth)
            const allQuizzes = loadQuizzes();
            const userQuizzes = allQuizzes.filter(q => q.user === user.username);

            ws.send(JSON.stringify({
              type: 'LOGIN_SUCCESS',
              payload: { username: user.username, email: user.email, quizzes: userQuizzes }
            }));
            console.log(`✅ Usuario autenticado: ${username}`);
          } else {
            ws.send(JSON.stringify({
              type: 'AUTH_ERROR',
              payload: { message: 'Usuario o contraseña incorrectos' }
            }));
          }
          break;
        }

        // 💾 GUARDAR QUIZ EN server/quizzes.json
        case 'SAVE_QUIZ': {
          try {
            const { user, quiz } = message.payload || {};
            if (!quiz || !quiz.title || !Array.isArray(quiz.questions)) {
              ws.send(JSON.stringify({ type: 'SAVE_QUIZ_ERROR', payload: { message: 'Payload inválido' } }));
              break;
            }

            const entry = {
              id: Date.now(),
              user: user || 'anonymous',
              title: quiz.title,
              questions: quiz.questions,
              createdAt: new Date().toISOString()
            };

            appendQuiz(entry);

            ws.send(JSON.stringify({ type: 'SAVE_QUIZ_SUCCESS', payload: { entry } }));
            console.log(`💾 Quiz guardado: ${entry.title} (por ${entry.user})`);
          } catch (err) {
            console.error('Error guardando quiz:', err);
            ws.send(JSON.stringify({ type: 'SAVE_QUIZ_ERROR', payload: { message: 'Error interno al guardar' } }));
          }
          break;
        }

        // 📥 OBTENER QUIZZES (por usuario o todos si no se especifica)
        case 'GET_QUIZZES': {
          try {
            const { user } = message.payload || {};
            const all = loadQuizzes();
            const quizzes = user ? all.filter(q => q.user === user) : all;
            ws.send(JSON.stringify({ type: 'GET_QUIZZES_SUCCESS', payload: { quizzes } }));
          } catch (err) {
            console.error('Error leyendo quizzes:', err);
            ws.send(JSON.stringify({ type: 'GET_QUIZZES_ERROR', payload: { message: 'Error interno' } }));
          }
          break;
        }

          // 🗑️ ELIMINAR QUIZ
          case 'DELETE_QUIZ': {
            try {
              const { user, quizTitle } = message.payload;
            
              if (!user || !quizTitle) {
                ws.send(JSON.stringify({
                  type: 'DELETE_QUIZ_ERROR',
                  payload: { message: 'Usuario o título del quiz no proporcionados' }
                }));
                break;
              }

              const deleted = deleteQuiz(user, quizTitle);

              if (deleted) {
                ws.send(JSON.stringify({
                  type: 'DELETE_QUIZ_SUCCESS',
                  payload: { message: 'Quiz eliminado correctamente' }
                }));
                console.log(`🗑️ Quiz eliminado: ${quizTitle} (de ${user})`);
              } else {
                ws.send(JSON.stringify({
                  type: 'DELETE_QUIZ_ERROR',
                  payload: { message: 'Quiz no encontrado' }
                }));
              }
            } catch (err) {
              console.error('Error eliminando quiz:', err);
              ws.send(JSON.stringify({
                type: 'DELETE_QUIZ_ERROR',
                payload: { message: 'Error interno al eliminar el quiz' }
              }));
            }
            break;
          }

        // 🎮 CREAR JUEGO
        case 'CREATE_GAME': {
          const pin = generatePin();
          games.set(pin, {
            pin,
            quiz: message.payload.quiz,
            host: ws,
            clients: [{ ws, username: 'Host', isHost: true }],
            state: 'LOBBY',
            currentQuestion: -1,
            scores: {},
            answers: {},
            questionTimer: null
          });
          ws.send(JSON.stringify({ type: 'GAME_CREATED', payload: { pin } }));
          break;
        }

        // 🧍 UNIRSE AL JUEGO
        case 'JOIN_GAME': {
          const { pin, username } = message.payload;
          const game = games.get(pin);
          if (!game) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Juego no encontrado' } }));
            break;
          }
          if (game.clients.some(c => c.username === username)) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Ese nombre ya está en uso' } }));
            break;
          }
          game.clients.push({ ws, username, isHost: false });
          game.scores[username] = 0;
          ws.send(JSON.stringify({ type: 'JOIN_SUCCESS', payload: { pin, username } }));
          const players = game.clients.filter(c => !c.isHost).map(c => c.username);
          broadcastToGame(pin, { type: 'PLAYER_JOINED', payload: { players } });
          break;
        }

        // ▶️ INICIAR JUEGO
        case 'START_GAME': {
          const { pin } = message.payload;
          const game = games.get(pin);
          if (!game || game.host !== ws) return;
          game.state = 'IN_PROGRESS';
          game.currentQuestion = 0;
          game.answers[0] = {};
          const q = game.quiz.questions[0];
          // Normalize question shape so clients always receive a `question` field
          const questionToSend = {
            question: q.question || q.text || q.prompt || '',
            options: Array.isArray(q.options) ? q.options : [],
            timeLimit: q.timeLimit || 20,
            correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : null
          };
          console.log('📤 Enviando pregunta inicial (normalizada):', questionToSend);  // Log para debug
          broadcastToGame(pin, {
            type: 'GAME_STARTED',
            payload: {
              question: questionToSend,
              questionIndex: 0,
              total: game.quiz.questions.length
            }
          });
          break;
        }

        // 📝 RECIBIR RESPUESTA
        case 'SUBMIT_ANSWER': {
          const { pin, questionIndex, answer, timeMs } = message.payload;
          const game = games.get(pin);
          if (!game) break;

          // Encontrar el username del jugador que responde
          const client = game.clients.find(c => c.ws === ws && !c.isHost);
          if (!client) break;

          // Si ya respondió, ignorar
          if (game.answers[questionIndex]?.[client.username]) break;

          // Guardar la respuesta
          if (!game.answers[questionIndex]) game.answers[questionIndex] = {};
          game.answers[questionIndex][client.username] = {
            answer,
            timeMs
          };

          // Calcular puntos si es correcta
          const correctAnswer = game.quiz.questions[questionIndex].correctAnswer;
          const isCorrect = answer === correctAnswer;
          const timePoints = Math.max(0, Math.floor((20000 - timeMs) / 1000)); // max 20 puntos por velocidad
          const points = isCorrect ? (1000 + timePoints) : 0;
          game.scores[client.username] = (game.scores[client.username] || 0) + points;

          // Notificar a todos que este jugador respondió
          broadcastToGame(pin, {
            type: 'ANSWER_RECEIVED',
            payload: {
              username: client.username,
              questionIndex
            }
          });

          // Si todos respondieron, mostrar resultados
          if (checkAllAnswered(game)) {
            showQuestionResults(pin);
          }
          break;
        }

        // ⏭️ SIGUIENTE PREGUNTA
        case 'NEXT_QUESTION': {
          const { pin } = message.payload;
          const game = games.get(pin);
          if (!game || game.host !== ws) break;
          showQuestionResults(pin);
          break;
        }
      }
    } catch (e) {
      console.error('❌ Error procesando mensaje:', e);
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor WebSocket corriendo en ws://${localIP}:${PORT}`);
});
