CREATE DATABASE AW_24;
USE AW_24;
-- tabla intermedia 1-1 para configuracion de accesibilidad de cada usuario
CREATE TABLE IF NOT EXISTS ACCESIBILIDADES (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paleta VARCHAR(100) NOT NULL,
    tamañoTexto VARCHAR(100) NOT NULL,
    navegacion VARCHAR(100) NOT NULL
   -- FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id)
);
-- Relacion 1-N con usuarios
CREATE TABLE IF NOT EXISTS FACULTADES (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

-- Se podria dividir en dos tablas hijas pero no se si es necesario
CREATE TABLE IF NOT EXISTS USUARIOS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(15) NOT NULL,
    facultad_id INT NOT NULL, 
    rol VARCHAR(100) NOT NULL,
    accesibilidad_id INT NOT NULL,
    password VARCHAR(100) NOT NULL,
    FOREIGN KEY (facultad_id) REFERENCES FACULTADES(id),
    FOREIGN KEY (accesibilidad_id) REFERENCES ACCESIBILIDADES(id)
);

-- Relacion M-N con participantes y N-1 con organizador
CREATE TABLE IF NOT EXISTS EVENTOS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    ubicacion VARCHAR(255) NOT NULL,
    capacidad_maxima INT NOT NULL,
    organizador_id INT,
    FOREIGN KEY (organizador_id) REFERENCES USUARIOS(id)
);
-- tabla intermedia N-M para participantes
CREATE TABLE IF NOT EXISTS Inscripciones (
    usuario_id INT,
    evento_id INT,
    estado VARCHAR(100) NOT NULL,
    fecha_inscripcion DATE NOT NULL,
    PRIMARY KEY (usuario_id, evento_id),
    FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id),
    FOREIGN KEY (evento_id) REFERENCES EVENTOS(id)
);
