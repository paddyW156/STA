import { useState, useEffect } from 'react';
import { useWebSocket } from './WebSocketProvider';
//import '../styles/QuizCreator.css';

export default function QuizCreator({ user, onFinish, onBack }) {
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    timeLimit: 20
  });

  // Hooks del WebSocket Provider
  const { send, lastMessage } = useWebSocket();
  const [pendingQuiz, setPendingQuiz] = useState(null);

  useEffect(() => {
    // Manejo simplificado: cuando el servidor confirma que guardó el quiz,
    // llamamos a onFinish para volver al Dashboard.
    if (!lastMessage || !pendingQuiz) return;

    if (lastMessage.type === 'SAVE_QUIZ_SUCCESS') {
      // Obtener la entrada guardada (si la envía el servidor)
      const savedEntry = lastMessage.payload?.entry || pendingQuiz;
      setPendingQuiz(null);
      // Volver al Dashboard. onFinish recibe el quiz guardado como argumento opcional.
      onFinish(savedEntry);
    }

    if (lastMessage.type === 'SAVE_QUIZ_ERROR') {
      alert('Error guardando quiz en el servidor: ' + (lastMessage.payload?.message || 'error'));
      // En caso de error servidor, aún podemos volver al dashboard y mantener el quiz localmente
      setPendingQuiz(null);
      onFinish(pendingQuiz);
    }
  }, [lastMessage, pendingQuiz, onFinish]);

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      alert('Escribe la pregunta');
      return;
    }
    if (currentQuestion.options.some(opt => !opt.trim())) {
      alert('Completa todas las opciones');
      return;
    }
    
    setQuestions(prev => [...prev, currentQuestion]);
    setCurrentQuestion({ 
      question: '', 
      options: ['', '', '', ''], 
      correctAnswer: 0, 
      timeLimit: 20 
    });
  };

  const removeQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const finishQuiz = async () => {
    if (!quizTitle.trim()) {
      alert('Por favor ingresa un título para el quiz');
      return;
    }
    if (questions.length === 0) {
      alert('Agrega al menos una pregunta');
      return;
    }

    const quiz = { title: quizTitle, questions };

    // Guardar el quiz en el perfil del usuario
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.username === user.username);
    
    if (userIndex !== -1) {
      if (!users[userIndex].quizzes) {
        users[userIndex].quizzes = [];
      }
      users[userIndex].quizzes.push(quiz);
      localStorage.setItem('users', JSON.stringify(users));
    }

      // Enviar al servidor mediante WebSocket (si está disponible). Si no, queda en localStorage.
      try {
        const message = { type: 'SAVE_QUIZ', payload: { user: user?.username || 'anonymous', quiz } };
        send(message);
        // Esperar confirmación del servidor antes de llamar onFinish
        setPendingQuiz(quiz);
      } catch (err) {
        console.error('Error enviando por WebSocket:', err);
        alert('Error al enviar por WebSocket. El quiz quedó guardado localmente.');
        onFinish(quiz);
      }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="auth-header-row">
          <button onClick={onBack} className="btn-back">← Volver</button>
          <h1 className="quizcreator-title" style={{ flex: 1, textAlign: 'center' }}>Creador de Quiz</h1>
          <div style={{ width: 86 }} />
        </div>

        <input
          type="text"
          placeholder="Título del Quiz"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
          className="auth-input"
        />

        <div className="creator-form">
          <input
            type="text"
            placeholder="Pregunta"
            value={currentQuestion.question}
            onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
            className="auth-input"
            style={{ fontSize: '1.15rem', padding: '14px 16px' }}
          />

          <div className="options-list">
            {currentQuestion.options.map((opt, i) => (
              <div key={i} className="option-input-wrapper">
                <input
                  type="text"
                  placeholder={`Opción ${i + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  className="auth-input"
                />
                <button
                  className={`correct-indicator ${currentQuestion.correctAnswer === i ? 'active' : ''}`}
                  onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: i })}
                  title="Marcar como respuesta correcta"
                  aria-pressed={currentQuestion.correctAnswer === i}
                >
                  ✓
                </button>
              </div>
            ))}
          </div>

          <div className="creator-settings">
            <div className="setting-group center">
              <label>Respuesta correcta</label>
              <div className="setting-control">{currentQuestion.correctAnswer}</div>
            </div>
            <div className="setting-group center">
              <label>Tiempo límite (segundos)</label>
              <input
                type="number"
                min="5"
                value={currentQuestion.timeLimit}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, timeLimit: Number(e.target.value) })}
                className="setting-input"
              />
            </div>
          </div>
        </div>

        <div className="creator-actions">
          <button onClick={addQuestion} className="btn btn-add">
            Añadir Pregunta
          </button>
          <button onClick={finishQuiz} className="btn btn-finish">
            Guardar y salir
          </button>
        </div>

        {questions.length > 0 && (
          <div className="questions-list">
            <h3 className="questions-list-title">
              Preguntas añadidas: {questions.length}
            </h3>
            {questions.map((q, i) => (
              <div key={i} className="question-item">
                <span className="question-number">{i + 1}.</span>
                <span className="question-text">{q.question}</span>
                <button
                  onClick={() => removeQuestion(i)}
                  className="btn-remove"
                  title="Eliminar pregunta"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}