const WebSocket = require('ws');
const http = require('http');

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
  const stats = [0, 0, 0, 0]; // Contador para cada opción
  
  Object.values(answers).forEach(answerData => {
    stats[answerData.answer]++;
  });
  
  return stats;
}

function showQuestionResults(pin) {
  const game = games.get(pin);
  if (!game) return;

  const prevQuestion = game.quiz.questions[game.currentQuestion];
  const answerStats = calculateAnswerStats(game);
  
  // Calcular puntos ganados en esta pregunta
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
      answerStats: answerStats,
      pointsThisQuestion: pointsThisQuestion
    }
  });

  // Auto-avanzar después de 8 segundos
  setTimeout(() => {
    game.currentQuestion++;

    if (game.currentQuestion >= game.quiz.questions.length) {
      game.state = 'FINISHED';
      
      const rankings = Object.entries(game.scores)
        .sort(([, a], [, b]) => b - a)
        .map(([username, score], index) => ({
          rank: index + 1,
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
  }, 8000); // 8 segundos para ver resultados
}

wss.on('connection', (ws) => {
  console.log('✓ Nueva conexión WebSocket');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('📨 Mensaje:', message.type);

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

          ws.send(JSON.stringify({
            type: 'GAME_CREATED',
            payload: { pin }
          }));
          console.log(`🎮 Juego creado con PIN: ${pin}`);
          break;
        }

        case 'JOIN_GAME': {
          const { pin, username } = message.payload;
          const game = games.get(pin);

          if (!game) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              payload: { message: 'Juego no encontrado' }
            }));
            break;
          }

          if (game.state !== 'LOBBY') {
            ws.send(JSON.stringify({
              type: 'ERROR',
              payload: { message: 'El juego ya ha comenzado' }
            }));
            break;
          }

          if (game.clients.some(c => c.username === username)) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              payload: { message: 'Ese nombre ya está en uso' }
            }));
            break;
          }

          game.clients.push({ ws, username, isHost: false });
          game.scores[username] = 0;

          ws.send(JSON.stringify({
            type: 'JOIN_SUCCESS',
            payload: { pin, username }
          }));

          const players = game.clients
            .filter(c => !c.isHost)
            .map(c => c.username);

          broadcastToGame(pin, {
            type: 'PLAYER_JOINED',
            payload: { players }
          });

          console.log(`👤 ${username} se unió al juego ${pin}`);
          break;
        }

        case 'START_GAME': {
          const { pin } = message.payload;
          const game = games.get(pin);

          if (!game || game.host !== ws) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              payload: { message: 'No autorizado' }
            }));
            break;
          }

          game.state = 'IN_PROGRESS';
          game.currentQuestion = 0;
          game.questionStartTime = Date.now();
          game.answers[0] = {};

          const question = game.quiz.questions[0];
          const timeLimit = question.timeLimit || 20;

          broadcastToGame(pin, {
            type: 'GAME_STARTED',
            payload: {
              question: {
                text: question.question,
                options: question.options,
                timeLimit: timeLimit
              },
              questionIndex: 0,
              total: game.quiz.questions.length
            }
          });

          // Timer automático para cuando se acabe el tiempo
          game.questionTimer = setTimeout(() => {
            if (game.state === 'IN_PROGRESS') {
              console.log(`⏰ Tiempo agotado en pregunta ${game.currentQuestion}`);
              showQuestionResults(pin);
            }
          }, timeLimit * 1000 + 500); // +500ms de margen

          console.log(`▶️  Juego ${pin} iniciado`);
          break;
        }

        case 'SUBMIT_ANSWER': {
          const { pin, questionIndex, answer, timeMs } = message.payload;
          const game = games.get(pin);

          if (!game) break;

          const client = game.clients.find(c => c.ws === ws);
          if (!client || client.isHost) break;

          if (game.answers[questionIndex]?.[client.username]) {
            break;
          }

          const question = game.quiz.questions[questionIndex];
          const isCorrect = answer === question.correctAnswer;

          let points = 0;
          if (isCorrect) {
            const maxTime = (question.timeLimit || 20) * 1000;
            const speedBonus = Math.floor(500 * (1 - timeMs / maxTime));
            points = 1000 + Math.max(0, speedBonus);
          }

          game.scores[client.username] = (game.scores[client.username] || 0) + points;
          
          if (!game.answers[questionIndex]) {
            game.answers[questionIndex] = {};
          }
          game.answers[questionIndex][client.username] = {
            answer,
            isCorrect,
            points,
            timeMs
          };

          game.host.send(JSON.stringify({
            type: 'ANSWER_RECEIVED',
            payload: { username: client.username }
          }));

          console.log(`✍️  ${client.username} respondió pregunta ${questionIndex}`);

          // Verificar si todos respondieron
          if (checkAllAnswered(game)) {
            console.log(`✅ Todos respondieron en pregunta ${questionIndex}`);
            if (game.questionTimer) {
              clearTimeout(game.questionTimer);
            }
            setTimeout(() => {
              showQuestionResults(pin);
            }, 1000); // 1 segundo de espera
          }
          break;
        }

        case 'NEXT_QUESTION': {
          const { pin } = message.payload;
          const game = games.get(pin);

          if (!game || game.host !== ws) break;

          // Limpiar timer si existe
          if (game.questionTimer) {
            clearTimeout(game.questionTimer);
          }

          showQuestionResults(pin);
          break;
        }

        case 'END_GAME': {
          const { pin } = message.payload;
          const game = games.get(pin);

          if (!game || game.host !== ws) break;

          if (game.questionTimer) {
            clearTimeout(game.questionTimer);
          }

          games.delete(pin);
          broadcastToGame(pin, {
            type: 'GAME_END',
            payload: { finalScores: [] }
          });

          console.log(`🗑️  Juego ${pin} eliminado`);
          break;
        }
      }
    } catch (error) {
      console.error('❌ Error procesando mensaje:', error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Error del servidor' }
      }));
    }
  });

  ws.on('close', () => {
    console.log('✗ Cliente desconectado');
    
    games.forEach((game, pin) => {
      const clientIndex = game.clients.findIndex(c => c.ws === ws);
      if (clientIndex !== -1) {
        const client = game.clients[clientIndex];
        
        if (client.isHost) {
          if (game.questionTimer) {
            clearTimeout(game.questionTimer);
          }
          games.delete(pin);
          broadcastToGame(pin, {
            type: 'ERROR',
            payload: { message: 'El host se desconectó' }
          });
        } else {
          game.clients.splice(clientIndex, 1);
          delete game.scores[client.username];
          
          const players = game.clients
            .filter(c => !c.isHost)
            .map(c => c.username);

          broadcastToGame(pin, {
            type: 'PLAYER_JOINED',
            payload: { players }
          });
        }
      }
    });
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log('');
  console.log('🚀 ════════════════════════════════════════');
  console.log('   SERVIDOR KAHOOT INICIADO');
  console.log('🚀 ════════════════════════════════════════');
  console.log(`   📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`   🌐 Servidor HTTP: http://localhost:${PORT}`);
  console.log('');
  console.log('   Esperando conexiones...');
  console.log('════════════════════════════════════════');
  console.log('');
});