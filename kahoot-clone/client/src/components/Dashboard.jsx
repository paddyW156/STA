import { useState, useEffect } from 'react';
import { useWebSocket } from './WebSocketProvider';
//import '../styles/Dashboard.css';

export default function Dashboard({ user, onLogout, onCreateNew, onSelectQuiz }) {
  const [quizzes, setQuizzes] = useState([]);

  const { send, lastMessage } = useWebSocket();

  useEffect(() => {
    if (user?.username) {
      send({ type: 'GET_QUIZZES', payload: { user: user.username } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.username]);

  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'GET_QUIZZES_SUCCESS':
        const serverQuizzes = lastMessage.payload?.quizzes || [];
        setQuizzes(serverQuizzes.map(q => ({ title: q.title, questions: q.questions })));
        break;
      
      case 'DELETE_QUIZ_SUCCESS':
        // Actualizar la lista después de eliminar
        send({ type: 'GET_QUIZZES', payload: { user: user.username } });
        break;

      case 'DELETE_QUIZ_ERROR':
        console.error('Error eliminando quiz:', lastMessage.payload?.message);
        alert('No se pudo eliminar el quiz. Por favor, inténtalo de nuevo.');
        break;

      case 'GET_QUIZZES_ERROR':
        console.error('Error obteniendo quizzes:', lastMessage.payload?.message);
        break;
    }
  }, [lastMessage]);

  const handleDeleteQuiz = (index) => {
    if (window.confirm('¿Estás seguro de eliminar este quiz?')) {
      const quizToDelete = quizzes[index];
      send({
        type: 'DELETE_QUIZ',
        payload: {
          user: user.username,
          quizTitle: quizToDelete.title
        }
      });
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="auth-header-row" style={{ marginBottom: 10 }}>
          <button onClick={onLogout} className="btn-back btn-logout">Cerrar Sesión</button>
          <h1 className="dashboard-title" style={{ textAlign: 'center' }}>Mis Quizzes</h1>
          <div style={{ width: 86 }} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <p className="dashboard-welcome">Bienvenido, <strong style={{ fontWeight: 900 }}>{user.username}</strong>!</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <button onClick={onCreateNew} className="btn btn-create">
            + Crear Nuevo Quiz
          </button>
        </div>

        <div className="quizzes-grid">
          {quizzes.length === 0 ? (
            <div className="empty-state">
              <p>No tienes quizzes guardados</p>
              <p className="empty-subtitle">¡Crea tu primer quiz!</p>
            </div>
          ) : (
            quizzes.map((quiz, index) => (
              <div key={index} className="quiz-row">
                <div className="quiz-row-left">
                  <span className="quiz-title">{quiz.title}</span>
                </div>
                <div className="quiz-row-center">
                  <span className="quiz-info">{quiz.questions.length} preguntas</span>
                </div>
                <div className="quiz-row-right">
                  <button
                    onClick={() => handleDeleteQuiz(index)}
                    className="btn-ghost btn-delete"
                    title="Eliminar quiz"
                    style={{ marginRight: 8 }}
                  >
                    ×
                  </button>
                  <button
                    onClick={() => onSelectQuiz(quiz)}
                    className="btn btn-primary"
                  >
                    Lanzar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}