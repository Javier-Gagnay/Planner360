FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements y instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código de la aplicación
COPY . .

# Variables de entorno
ENV PYTHONPATH=/app
ENV SECRET_KEY=change-this-secret-key-in-production
ENV ENVIRONMENT=production
ENV ALLOWED_ORIGINS=*

# Crear directorio para la base de datos
RUN mkdir -p /app/data

# Crear usuario no-root para seguridad
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

# Exponer el puerto
EXPOSE 8001

# Comando para ejecutar la aplicación
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]