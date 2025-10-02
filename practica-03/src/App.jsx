import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const [peliculas, setPeliculas] = useState([])  // estado para todas las películas
  const scrollRef1 = useRef(null)
  const scrollRef2 = useRef(null)

  // Al cargar, traer las películas del servidor
  useEffect(() => {
    const fetchPeliculas = async () => {
      try {
        const resp = await fetch('http://localhost:3000/peliculas')  // ajusta la URL si tu servidor está en otro puerto / dominio
        if (!resp.ok) {
          console.error("Error al traer películas:", resp.status, resp.statusText)
          return
        }
        const data = await resp.json()
        setPeliculas(data)
      } catch (err) {
        console.error("Error en fetch:", err)
      }
    }

    fetchPeliculas()
  }, [])

  // Centrar el scroll al cargar, una vez que las películas estén cargadas
  useEffect(() => {
    const scrollToCenter = (ref) => {
      if (ref.current) {
        const container = ref.current
        const scrollWidth = container.scrollWidth
        const clientWidth = container.clientWidth
        container.scrollLeft = (scrollWidth - clientWidth) / 2
      }
    }
    scrollToCenter(scrollRef1)
    scrollToCenter(scrollRef2)
  }, [peliculas])  // depende del estado de películas, para que se centre después de cargar

  return (
    <div style={styles.total}>
      <div style={styles.card}>
        <h1>FILM4u</h1>
        <p style={styles.slogan}>your film, 4 u</p>
      </div>

      {/* Scroll de películas en la categoría 1 (puedes tener múltiples categorías si haces filtros) */}
      <div style={styles.categoryContainer}>
        <h3>Películas:</h3>
        <div style={styles.scrollContainer} ref={scrollRef1}>
          {peliculas.map((peli, idx) => (
            <div style={styles.item} key={`peli1-${idx}`}>
              {peli.nombrePeli} <br /> ({peli.anio})
            </div>
          ))}
        </div>
      </div>

      {/* Ejemplo: puedes repetir para otra categoría */}
      <div style={styles.categoryContainer}>
        <h3>Otra sección películas:</h3>
        <div style={styles.scrollContainer} ref={scrollRef2}>
          {peliculas.map((peli, idx) => (
            <div style={styles.item} key={`peli2-${idx}`}>
              {peli.nombrePeli} <br /> ({peli.anio})
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App

const styles = {
  total: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#C8a2c8',
    minHeight: '100vh',
    width: '100vw',
    overflowY: 'auto'
  },
  card: {
    marginTop: '10px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  slogan: {
    fontStyle: 'italic',
    marginTop: '1px',
    fontSize: '20px'
  },
  categoryContainer: {
    width: '95%',
    margin: '20px 0',
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: '#fff'
  },
  scrollContainer: {
    width: '100%',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    border: '1px solid black',
    padding: '0 16px',
    boxSizing: 'border-box',
  },
  item: {
    display: 'inline-block',
    width: '200px',
    height: '120px',
    marginRight: '10px',
    backgroundColor: '#A982B9',
    color: 'white',
    textAlign: 'center',
    lineHeight: '24px',
    padding: '10px',
    borderRadius: '8px',
    fontWeight: 'bold'
  }
}
