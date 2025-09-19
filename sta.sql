DROP DATABASE IF EXISTS `sta`;
CREATE DATABASE `sta`;
USE `sta`;

-- Tabla actores
CREATE TABLE actores (
  id_actor INT NOT NULL AUTO_INCREMENT,
  nombreActor VARCHAR(200) NOT NULL,
  anioNacimiento YEAR NOT NULL,
  PRIMARY KEY (id_actor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla peliculas
CREATE TABLE peliculas (
  id INT NOT NULL AUTO_INCREMENT,
  nombrePeli VARCHAR(200) NOT NULL,
  anio YEAR NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla intermedia actor_peli
CREATE TABLE actor_peli (
  id_actor INT NOT NULL,
  id_peli INT NOT NULL,
  PRIMARY KEY (id_actor, id_peli),
  CONSTRAINT fk_actor FOREIGN KEY (id_actor) REFERENCES actores(id_actor) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_peli FOREIGN KEY (id_peli) REFERENCES peliculas(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Datos iniciales
INSERT INTO actores (nombreActor, anioNacimiento) VALUES ('Tom Holland', 1996);
INSERT INTO peliculas (nombrePeli, anio) VALUES ('Spider-Man: Un nuevo universo', 2018);
INSERT INTO actor_peli (id_actor, id_peli) VALUES (1, 1);
