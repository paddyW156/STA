import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const [peliculas, setPeliculas] = useState([])

  // Cargar películas del backend
  useEffect(() => {
    const fetchPeliculas = async () => {
      try {
        const resp = await fetch('http://localhost:3000/peliculas_info')
        if (!resp.ok) throw new Error(`Error HTTP: ${resp.status}`)
        const data = await resp.json()
        setPeliculas(data)
      } catch (err) {
        console.error("Error al traer películas:", err)
      }
    }

    fetchPeliculas()
  }, [])
  
  // Categorías de ejemplo (puedes filtrarlas según tu BD)
  const categorias = ["Acción", "Aventura", "Animación"].map(cat => ({
  nombre: cat,
  peliculas: peliculas.filter(p => p.categoria === cat)
  }))
  


  return (
    <div >
      <header className='total'>
        <h1>FILM4u</h1>
        <p className='slogan'>your film, 4 u</p>
      </header>

      {categorias.map((cat, idx) => (
        <Category key={idx} nombre={cat.nombre} peliculas={cat.peliculas} />
      ))}
    </div>
  )
}

export default App

// =============================
// 🔹 Función: Category
// =============================
function Category({ nombre, peliculas }) {
  const scrollRef = useRef(null)

  // Centrar scroll una vez cargadas las pelis
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
    }
  }, [peliculas])

  return (
    <div className='categoryContainer'>
      <h3>{nombre}</h3>
      <div className='scrollContainer' ref={scrollRef}>
        {peliculas.map((peli, idx) => (
          <MovieCard key={idx} peli={peli} />
        ))}
      </div>
    </div>
  )
}

// =============================
// 🔹 Función: pelicula
// =============================
function MovieCard({ peli }) {
  const [mostrarInfo, setMostrarInfo] = useState(false)

  return (
    <div className='item'>
      <h4>{peli.nombrePeli}</h4>

      <button
        className='buttom'
        onClick={() => setMostrarInfo(!mostrarInfo)}
      >
        {mostrarInfo ? "Ocultar info" : "Ver más"}
      </button>

      {mostrarInfo && (
        <div className='infoBox'>
          <p>Año: {peli.anio}</p>
          <p>Director: {peli.director}</p>
          <p>Actores: {peli.actores}</p>
        </div>
      )}
    </div>
  )
}
