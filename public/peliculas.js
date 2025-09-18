document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("listaPeliculas");
  const btnBuscar = document.getElementById("btnBuscar");
  const btnAgregar = document.getElementById("btnAgregar");

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
        li.textContent = `${p.nombrePeli} (${p.anio})`;
        li.innerHTML += ` <button onclick="eliminarPeli(${p.id})">❌</button>`;
        lista.appendChild(li);
      });
    } catch (e) {
      console.error(e);
    }
  });

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

async function eliminarPeli(id) {
  if (!confirm("¿Seguro que quieres eliminar esta película?")) return;
  await fetch(`/peliculas/${id}`, { method: "DELETE" });
  alert("Película eliminada");
}
