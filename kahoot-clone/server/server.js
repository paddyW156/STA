const WebSocket = require('ws');
const http = require('http');
const os = require('os');

// === Obtener IP local (para conexiones LAN) ===
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

// === Servidor HTTP + WebSocket ===
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
      console.log(`🏁 Juego ${pin} terminado`);
    } else {
      const question = game.quiz.questions[game.currentQuestion];
      game.questionStartTime = Date.now();
      game.answers[game.currentQuestion] = {};
      broadcastToGame(pin, {
        type: 'QUESTION_START',
        payload: {
          question: {
            text: question.question,
            options: question.options,
            timeLimit: question.timeLimit || 20
          },
          questionIndex: game.currentQuestion,
          total: game.quiz.questions.length
        }
      });
    }
  }, 8000);
}

wss.on('connection', (ws) => {
  console.log('✓ Nueva conexión WebSocket');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
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
          console.log(`🎮 Juego creado con PIN: ${pin}`);
          break;
        }

        case 'JOIN_GAME': {
          const { pin, username } = message.payload;
          const game = games.get(pin);
          if (!game) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Juego no encontrado' } }));
            break;
          }
          if (game.state !== 'LOBBY') {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'El juego ya ha comenzado' } }));
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
          console.log(`👤 ${username} se unió al juego ${pin}`);
          break;
        }

        case 'START_GAME': {
          const { pin } = message.payload;
          const game = games.get(pin);
          if (!game || game.host !== ws) return;
          game.state = 'IN_PROGRESS';
          game.currentQuestion = 0;
          game.answers[0] = {};
          const q = game.quiz.questions[0];
          broadcastToGame(pin, {
            type: 'GAME_STARTED',
            payload: {
              question: { text: q.question, options: q.options, timeLimit: q.timeLimit || 20 },
              questionIndex: 0,
              total: game.quiz.questions.length
            }
          });
          game.questionTimer = setTimeout(() => showQuestionResults(pin), (q.timeLimit || 20) * 1000 + 500);
          console.log(`▶️ Juego ${pin} iniciado`);
          break;
        }

        case 'SUBMIT_ANSWER': {
          const { pin, questionIndex, answer, timeMs } = message.payload;
          const game = games.get(pin);
          if (!game) return;
          const client = game.clients.find(c => c.ws === ws);
          if (!client || client.isHost) return;
          if (game.answers[questionIndex]?.[client.username]) return;

          const q = game.quiz.questions[questionIndex];
          const isCorrect = answer === q.correctAnswer;
          let points = 0;
          if (isCorrect) {
            const maxTime = (q.timeLimit || 20) * 1000;
            const speedBonus = Math.floor(500 * (1 - timeMs / maxTime));
            points = 1000 + Math.max(0, speedBonus);
          }
          game.scores[client.username] = (game.scores[client.username] || 0) + points;
          if (!game.answers[questionIndex]) game.answers[questionIndex] = {};
          game.answers[questionIndex][client.username] = { answer, isCorrect, points, timeMs };
          game.host.send(JSON.stringify({ type: 'ANSWER_RECEIVED', payload: { username: client.username } }));
          if (checkAllAnswered(game)) {
            if (game.questionTimer) clearTimeout(game.questionTimer);
            setTimeout(() => showQuestionResults(pin), 1000);
          }
          break;
        }

        case 'NEXT_QUESTION':
          showQuestionResults(message.payload.pin);
          break;
        case 'END_GAME':
          games.delete(message.payload.pin);
          break;
      }
    } catch (e) {
      console.error('❌ Error procesando mensaje:', e);
      ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Error del servidor' } }));
    }
  });

  ws.on('close', () => console.log('✗ Cliente desconectado'));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ════════════════════════════════════════');
  console.log('   SERVIDOR KAHOOT INICIADO');
  console.log('🚀 ════════════════════════════════════════');
  console.log(`   📡 WebSocket: ws://${localIP}:${PORT}`);
  console.log(`   🌐 Abre el cliente en: http://${localIP}:5173`);
  console.log('════════════════════════════════════════');
  console.log('');
});
