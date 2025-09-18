document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("listaActores");
  const btnListar = document.getElementById("btnListar");
  const btnAgregar = document.getElementById("btnAgregarActor");

  btnListar.addEventListener("click", async () => {
    lista.innerHTML = "";
    try {
      const res = await fetch("/actores"); // ⚠️ tu backend no tiene GET actores, habría que añadirlo
      if (!res.ok) {
        lista.innerHTML = "<li>No hay actores</li>";
        return;
      }
      const actores = await res.json();
      actores.forEach(a => {
        const li = document.createElement("li");
        li.textContent = `${a.nombreActor} (${a.anioNacimiento})`;
        li.innerHTML += ` <button onclick="eliminarActor(${a.id})">❌</button>`;
        lista.appendChild(li);
      });
    } catch (e) {
      console.error(e);
    }
  });

  btnAgregar.addEventListener("click", async () => {
    const nombre = document.getElementById("nombreActor").value;
    const anio = document.getElementById("anioNacimiento").value;
    try {
      const res = await fetch("/actores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreActor: nombre, anioNacimiento: anio })
      });
      const data = await res.json();
      alert(`Actor añadido con id ${data.id_actor}`);
    } catch (e) {
      console.error(e);
    }
  });
});

async function eliminarActor(id) {
  if (!confirm("¿Seguro que quieres eliminar este actor?")) return;
  await fetch(`/actores/${id_actor}`, { method: "DELETE" });
  alert("Actor eliminado");
}
