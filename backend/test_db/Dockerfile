FROM mysql:8.0

# Copy the initialization script
COPY ./initdb.d/ /docker-entrypoint-initdb.d/

# Expose the MySQL port
EXPOSE 3306
