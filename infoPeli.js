const btn = document.getElementById('miBoton');
const msg = document.getElementById('mensaje');
const input = document.getElementById('titulo');

// ⚠️ Reemplaza "TU_API_KEY" con tu key real de OMDb
const API_KEY = "ffd61bd5";  

btn.addEventListener('click', async () => {
  const titulo = input.value.trim();

  if (!titulo) {
    msg.textContent = "Por favor, escribe un título de película.";
    return;
  }

  try {
    // llamada a la API
    const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(titulo)}&apikey=${API_KEY}`);
    const data = await res.json();

    if (data.Response === "False") {
      msg.textContent = `No se encontró la película: ${titulo}`;
    } else {
      msg.innerHTML = `
        <h2>${data.Title} (${data.Year})</h2>
        <p><strong>Director:</strong> ${data.Director}</p>
        <p><strong>Género:</strong> ${data.Genre}</p>
        <p><strong>IMDB Rating:</strong> ${data.imdbRating}</p>
        <img src="${data.Poster}" alt="Poster de ${data.Title}" style="max-width:200px;">
      `;
    }
  } catch (error) {
    msg.textContent = "Error al conectar con la API.";
    console.error(error);
  }
});