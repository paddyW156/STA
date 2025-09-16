const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Carpeta para archivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/pacientes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pacientes.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});