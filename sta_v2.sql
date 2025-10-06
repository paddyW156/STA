-- MySQL dump 10.13  Distrib 9.4.0, for Win64 (x86_64)
--
-- Host: localhost    Database: sta
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `actor_peli`
--

DROP TABLE IF EXISTS `actor_peli`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `actor_peli` (
  `id_actor` int NOT NULL,
  `id_peli` int NOT NULL,
  PRIMARY KEY (`id_actor`,`id_peli`),
  KEY `fk_peli` (`id_peli`),
  CONSTRAINT `fk_actor` FOREIGN KEY (`id_actor`) REFERENCES `actores` (`id_actor`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_peli` FOREIGN KEY (`id_peli`) REFERENCES `peliculas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actor_peli`
--

LOCK TABLES `actor_peli` WRITE;
/*!40000 ALTER TABLE `actor_peli` DISABLE KEYS */;
INSERT INTO `actor_peli` VALUES (1,1);
/*!40000 ALTER TABLE `actor_peli` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `actores`
--

DROP TABLE IF EXISTS `actores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `actores` (
  `id_actor` int NOT NULL AUTO_INCREMENT,
  `nombreActor` varchar(200) NOT NULL,
  `anioNacimiento` year NOT NULL,
  PRIMARY KEY (`id_actor`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actores`
--

LOCK TABLES `actores` WRITE;
/*!40000 ALTER TABLE `actores` DISABLE KEYS */;
INSERT INTO `actores` VALUES (1,'Tom Holland',1996);
/*!40000 ALTER TABLE `actores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `peliculas`
--

DROP TABLE IF EXISTS `peliculas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `peliculas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombrePeli` varchar(200) NOT NULL,
  `anio` year NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `director` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `peliculas`
--

LOCK TABLES `peliculas` WRITE;
/*!40000 ALTER TABLE `peliculas` DISABLE KEYS */;
INSERT INTO `peliculas` VALUES (1,'Spider-Man: Un nuevo universo',2018,'Animación','Bob Persichetti'),(2,'La Isla Perdida',2020,'Aventura','Carlos Méndez'),(3,'Misión Imposible: Renegado',2018,'Acción','Tom Cruise'),(4,'El Tesoro Escondido',2021,'Aventura','Laura Gómez'),(5,'Furia en la Ciudad',2019,'Acción','Diego Ramírez'),(6,'Expedición Secreta',2022,'Aventura','Ana Torres'),(7,'Golpe Maestro',2020,'Acción','Javier López'),(8,'Cazadores de Misterios',2023,'Aventura','Mariana Ruiz'),(9,'Operación Relámpago',2021,'Acción','Ricardo Sánchez'),(10,'La Fortaleza Oculta',2021,'Aventura','Santiago Morales'),(11,'Reto Imposible',2022,'Acción','Claudia Fernández'),(12,'El Misterio del Bosque',2020,'Aventura','Andrés Paredes'),(13,'Golpe Final',2019,'Acción','Valeria Torres'),(14,'Expedición Prohibida',2023,'Aventura','Jorge Ramírez'),(15,'Fuego en la Ciudad',2021,'Acción','Lucía Navarro'),(16,'Tesoros Perdidos',2022,'Aventura','Martín Salazar'),(17,'Operación Trueno',2020,'Acción','Patricia Gómez');
/*!40000 ALTER TABLE `peliculas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-06 11:13:13
