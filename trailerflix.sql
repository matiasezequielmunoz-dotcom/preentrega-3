CREATE DATABASE IF NOT EXISTS `trailerflix`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `trailerflix`;

CREATE TABLE IF NOT EXISTS `categorias` (
	`id_categoria` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(50) NOT NULL UNIQUE,
	PRIMARY KEY (`id_categoria`)
);
CREATE TABLE IF NOT EXISTS `contenidos` (
	`id_contenido` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(150) NOT NULL,
	`sinopsis` text NOT NULL,
	`temporadas` int,
	`trailer` varchar(500),
	`id_categoria` int NOT NULL,
	PRIMARY KEY (`id_contenido`)
);
CREATE TABLE IF NOT EXISTS `generos` (
	`id_genero` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(80) NOT NULL UNIQUE,
	PRIMARY KEY (`id_genero`)
);
CREATE TABLE IF NOT EXISTS `actores` (
	`id_actor` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(150) NOT NULL,
	PRIMARY KEY (`id_actor`)
);
CREATE TABLE IF NOT EXISTS `contenido_generos` (
	`id_contenido` int NOT NULL,
	`id_genero` int NOT NULL,
	`orden` smallint NOT NULL,
	PRIMARY KEY (`id_contenido`, `id_genero`)
);
CREATE TABLE IF NOT EXISTS `contenido_actores` (
	`id_contenido` int NOT NULL,
	`id_actor` int NOT NULL,
	`orden` smallint NOT NULL,
	PRIMARY KEY (`id_contenido`, `id_actor`)
);
ALTER TABLE `contenidos` ADD CONSTRAINT `contenidos_fk5` FOREIGN KEY (`id_categoria`) REFERENCES `categorias`(`id_categoria`);
ALTER TABLE `contenido_generos` ADD CONSTRAINT `contenido_generos_fk0` FOREIGN KEY (`id_contenido`) REFERENCES `contenidos`(`id_contenido`);
ALTER TABLE `contenido_generos` ADD CONSTRAINT `contenido_generos_fk1` FOREIGN KEY (`id_genero`) REFERENCES `generos`(`id_genero`);
ALTER TABLE `contenido_actores` ADD CONSTRAINT `contenido_actores_fk0` FOREIGN KEY (`id_contenido`) REFERENCES `contenidos`(`id_contenido`);
ALTER TABLE `contenido_actores` ADD CONSTRAINT `contenido_actores_fk1` FOREIGN KEY (`id_actor`) REFERENCES `actores`(`id_actor`);