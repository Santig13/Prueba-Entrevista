# Usamos la imagen oficial de MySQL como base
FROM mysql:8.0

# Configurar variables de entorno para MySQL
ENV MYSQL_ROOT_PASSWORD=rootpassword
ENV MYSQL_DATABASE=cyclops_db

# Copiamos el script SQL en el contenedor
COPY ./init.sql /docker-entrypoint-initdb.d/

# Exponemos el puerto 3306 (el puerto por defecto de MySQL)
EXPOSE 3306
