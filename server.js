const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
const mysql = require('mysql2/promise');

app.use(express.json()); // Para leer JSON en body
app.use(express.static(path.join(__dirname, 'public')));

// --- Conexión a MySQL ---
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sta'
});


// --- Rutas estáticas ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// ======================
// RUTAS API PELÍCULAS
// ======================

// Buscar película por nombrePeli
app.get('/peliculas', async (req, res) => {
  const { nombrePeli } = req.query;
  let [rows] = nombrePeli
    ? await pool.query('SELECT * FROM peliculas WHERE nombrePeli LIKE ?', [`%${nombrePeli}%`])
    : await pool.query('SELECT * FROM peliculas');
  
  if (nombrePeli && rows.length === 0) {
    return res.status(404).json({ mensaje: 'No existe' });
  }
  res.json(rows);
});

// Crear película
app.post('/peliculas', async (req, res) => {
  const { nombrePeli, anio } = req.body;
  const [result] = await pool.query(
    'INSERT INTO peliculas (nombrePeli, anio) VALUES (?, ?)',
    [nombrePeli, anio]
  );
  res.status(201).json({ id: result.insertId, nombrePeli, anio });
});

// Borrar película
app.delete('/peliculas/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM peliculas WHERE id = ?', [id]);
  res.json({ mensaje: `Película ${id} eliminada` });
});

// Cambiar nombre/año
app.patch('/peliculas/:id', async (req, res) => {
  const { id } = req.params;
  const { nombrePeli, anio } = req.body;
  if (nombrePeli) {
    await pool.query('UPDATE peliculas SET nombrePeli=? WHERE id=?', [nombrePeli, id]);
  }
  if (anio) {
    await pool.query('UPDATE peliculas SET anio=? WHERE id=?', [anio, id]);
  }
  res.json({ mensaje: `Película ${id} actualizada` });
});

// Añadir actor a película (crea el actor si no existe y luego añade la relación)
app.post('/peliculas/:id/actores', async (req, res) => {
  const { id } = req.params; // id de la película
  const { Nombre, Año } = req.body; // datos del actor

  // 1️⃣ Crear actor
  const [actorExistente] = await pool.query(
    'SELECT * FROM actores WHERE nombre = ? AND anio_nacimiento = ?',
    [Nombre, Año]
  );

  let id_actor;
  if (actorExistente.length > 0) {
    // El actor ya existe
    id_actor = actorExistente[0].id;
  } else {
    // Crear nuevo actor
    const [result] = await pool.query(
      'INSERT INTO actores (nombre, anio_nacimiento) VALUES (?, ?)',
      [Nombre, Año]
    );
    id_actor = result.insertId;
  }

  // 2️⃣ Crear relación en actor_peli
  await pool.query(
    'INSERT IGNORE INTO actor_peli (id_peli, id_actor) VALUES (?, ?)',
    [id, id_actor]
  );

  res.json({ mensaje: `Actor ${Nombre} añadido a película ${id}`, id_actor });
});

// Quitar actor de película (solo elimina la relación)
app.delete('/peliculas/:id/actores/:id_actor', async (req, res) => {
  const { id, id_actor } = req.params;

  await pool.query(
    'DELETE FROM actor_peli WHERE id_peli = ? AND id_actor = ?',
    [id, id_actor]
  );

  res.json({ mensaje: `Actor ${id_actor} quitado de película ${id}` });
});

// ======================
// RUTAS API ACTORES
// ======================

// Crear actor
app.post('/actores', async (req, res) => {
  const { nombreActor, anioNacimiento } = req.body;
  const [result] = await pool.query(
    'INSERT INTO actores (nombreActor, anio_nacimiento) VALUES (?, ?)',
    [nombreActor, anioNacimiento]
  );
  res.status(201).json({ id: result.insertId, nombreActor, anioNacimiento });
});

// Borrar actor
app.delete('/actores/:id_actor', async (req, res) => {
  const { id_actor } = req.params;
  await pool.query('DELETE FROM actores WHERE id=?', [id_actor]);
  res.json({ mensaje: `Actor ${id_actor} eliminado` });
});

// Modificar actor
app.patch('/actores/:id_actor', async (req, res) => {
  const { id_actor } = req.params;
  const { nombreActor, anioNacimiento } = req.body;
  if (nombreActor) {
    await pool.query('UPDATE actores SET nombreActor=? WHERE id=?', [nombreActor, id_actor]);
  }
  if (anioNacimiento) {
    await pool.query('UPDATE actores SET anio_nacimiento=? WHERE id=?', [anioNacimiento, id_actor]);
  }
  res.json({ mensaje: `Actor ${id_actor} actualizado` });
});

// ======================
// Iniciar servidor
// ======================
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});