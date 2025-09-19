document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("listaPeliculas");
  const btnBuscar = document.getElementById("btnBuscar");
  const btnAgregar = document.getElementById("btnAgregar");

  // Buscar películas
  btnBuscar.addEventListener("click", async () => {
    const nombre = document.getElementById("buscarPeli").value;
    lista.innerHTML = "";
    try {
      const res = await fetch(`/peliculas?nombrePeli=${nombre}`);
      if (!res.ok) {
        lista.innerHTML = "<li>No encontrada</li>";
        return;
      }
      const peliculas = await res.json();
      peliculas.forEach(p => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${p.nombrePeli} (${p.anio})</strong>
          <button onclick="eliminarPeli(${p.id})">❌</button>
          <button onclick="mostrarEditar(${p.id}, '${p.nombrePeli}', ${p.anio})">✏️ Editar información de la película</button>
          <button onclick="mostrarActores(${p.id})">🎭 Actores</button>
          <div id="editar-${p.id}" style="display:none; margin:5px 0;"></div>
          <div id="actores-${p.id}" style="display:none; margin:5px 0;"></div>
        `;
        lista.appendChild(li);
      });
    } catch (e) {
      console.error(e);
    }
  });

  // Agregar nueva película
  btnAgregar.addEventListener("click", async () => {
    const nombre = document.getElementById("nuevaPeli").value;
    const anio = document.getElementById("nuevoAnio").value;
    try {
      const res = await fetch("/peliculas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombrePeli: nombre, anio })
      });
      const data = await res.json();
      alert(`Película añadida con id ${data.id}`);
    } catch (e) {
      console.error(e);
    }
  });
});

// ======= FUNCIONES EXTRA =======

// Eliminar película
async function eliminarPeli(id) {
  if (!confirm("¿Seguro que quieres eliminar esta película?")) return;
  await fetch(`/peliculas/${id}`, { method: "DELETE" });
  alert("Película eliminada");
}

// Mostrar formulario de edición
function mostrarEditar(id, nombre, anio) {
  const div = document.getElementById(`editar-${id}`);
  div.style.display = div.style.display === "none" ? "block" : "none";
  div.innerHTML = `
    <input type="text" id="editNombre-${id}" value="${nombre}">
    <input type="number" id="editAnio-${id}" value="${anio}">
    <button onclick="guardarEdicion(${id})">💾 Guardar</button>
  `;
}

// Guardar cambios en película
async function guardarEdicion(id) {
  const nombre = document.getElementById(`editNombre-${id}`).value;
  const anio = document.getElementById(`editAnio-${id}`).value;

  await fetch(`/peliculas/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombrePeli: nombre, anio })
  });

  alert("Película actualizada");
}

// Mostrar gestión de actores
async function mostrarActores(id) {
  const div = document.getElementById(`actores-${id}`);
  div.style.display = div.style.display === "none" ? "block" : "none";

  if (div.style.display === "none") return; // si se oculta, no recargamos nada

  // Formulario para añadir actor
  div.innerHTML = `
    <h4>Actores</h4>
    <input type="text" id="actorNombre-${id}" placeholder="Nombre actor">
    <input type="number" id="actorAnio-${id}" placeholder="Año nacimiento">
    <button onclick="agregarActor(${id})">➕ Añadir</button>
    <ul id="listaActores-${id}"></ul>
  `;

  // Cargar actores de esa película desde el backend
  try {
    const res = await fetch(`/peliculas/${id}/actores`);
    const actores = await res.json();

    const lista = document.getElementById(`listaActores-${id}`);
    lista.innerHTML = "";

    if (actores.length === 0) {
      lista.innerHTML = "<li>(sin actores)</li>";
      return;
    }

    actores.forEach(actor => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${actor.nombreActor} (${actor.anioNacimiento})
        <button onclick="quitarActor(${id}, ${actor.id_actor})">❌</button>
      `;
      lista.appendChild(li);
    });
  } catch (e) {
    console.error("Error cargando actores:", e);
  }
}


async function agregarActor(id) {
  const nombre = document.getElementById(`actorNombre-${id}`).value;
  const anio = document.getElementById(`actorAnio-${id}`).value;

  await fetch(`/peliculas/${id}/actores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Nombre: nombre, Año: anio })
  });

  alert("Actor añadido a la película");
  mostrarActores(id); // recargar lista
}


// Quitar actor de película
async function quitarActor(id, id_actor) {
  await fetch(`/peliculas/${id}/actores/${id_actor}`, { method: "DELETE" });
  alert("Actor eliminado de la película");
  mostrarActores(id); // recargar lista
}

