# Project Planner - Aplicación Web Completa

Una aplicación web de planificación de proyectos con autenticación, gestión de usuarios y base de datos.

## 🚀 Características

- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Backend**: FastAPI (Python)
- **Base de datos**: Supabase (PostgreSQL en la nube) / SQLite (desarrollo local)
- **Autenticación**: JWT (JSON Web Tokens) + Supabase Auth
- **Seguridad**: Row Level Security (RLS), hashing de contraseñas, CORS configurado
- **Tiempo Real**: Actualizaciones en tiempo real con Supabase Realtime
- **Despliegue**: Docker, Docker Compose, Nginx, Railway, Vercel
- **Escalabilidad**: Base de datos en la nube, backup automático
- Sistema de usuarios con roles (usuario/administrador)
- Gestión completa de proyectos y tareas
- Interfaz moderna y responsiva
- Panel de administración

## 📋 Requisitos

- Python 3.11+
- Docker y Docker Compose (para despliegue)
- Node.js (opcional, para desarrollo)

## 📦 Instalación y Configuración

### Opción 1: Desarrollo Local con Supabase (Recomendado)

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd planner-interno
   ```

2. **Configurar Supabase**
   - Sigue la guía detallada en `docs/SUPABASE_SETUP.md`
   - Crea un proyecto en [Supabase](https://supabase.com)
   - Ejecuta el script `backend/supabase_schema.sql`
   - Configura las variables de entorno

3. **Configurar el backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   # Editar .env con tus credenciales de Supabase
   ```

4. **Iniciar el backend**
   ```bash
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
   ```

5. **Iniciar el frontend**
   ```bash
   cd frontend
   python -m http.server 8000
   ```

6. **Acceder a la aplicación**
   - Frontend: http://localhost:8000/src
   - API: http://localhost:8001
   - Documentación API: http://localhost:8001/docs

### Opción 2: Desarrollo Local con SQLite (Legacy)

1. **Usar la versión SQLite**
   ```bash
   cd backend
   cp main.py main_supabase.py
   cp main_sqlite_backup.py main.py  # Si existe
   ```

2. **Seguir pasos 3-6 de la Opción 1**

#### Frontend
```bash
# En el directorio raíz del proyecto
python -m http.server 8000

# O usar cualquier servidor web estático
# Ejemplo con Node.js:
npx serve . -p 8000
```

### Opción 2: Docker (Recomendado para Producción)

```bash
# Construir y ejecutar con Docker Compose
docker-compose up --build

# En modo detached (segundo plano)
docker-compose up -d --build
```

## 🌐 Opciones de Despliegue Público

### 1. Railway (Recomendado - Fácil y Gratuito)

1. Crear cuenta en [Railway.app](https://railway.app)
2. Conectar tu repositorio de GitHub
3. Railway detectará automáticamente el Dockerfile
4. Configurar variables de entorno:
   - `SECRET_KEY`: Una clave secreta segura
   - `PORT`: 8001

### 2. Heroku

```bash
# Instalar Heroku CLI
# Crear aplicación
heroku create tu-app-name

# Configurar variables de entorno
heroku config:set SECRET_KEY=tu-clave-secreta-aqui

# Desplegar
git push heroku main
```

### 3. Vercel (Solo Frontend) + Railway (Backend)

#### Frontend en Vercel:
1. Conectar repositorio en [Vercel.com](https://vercel.com)
2. Configurar build settings:
   - Build Command: `echo "No build needed"`
   - Output Directory: `./`

#### Backend en Railway:
- Seguir los pasos de Railway mencionados arriba

### 4. DigitalOcean App Platform

1. Crear cuenta en DigitalOcean
2. Usar App Platform
3. Conectar repositorio
4. Configurar como aplicación Docker

## 🔐 Credenciales por Defecto

La aplicación incluye un usuario administrador por defecto (creado automáticamente en Supabase):

- **Usuario**: `admin123`
- **Contraseña**: `admin123`
- **Email**: `admin@planner.com`
- **Rol**: Administrador

> ⚠️ **Importante**: Cambia estas credenciales en producción por seguridad.
> 
> **Nota**: Si usas Supabase, el usuario se crea automáticamente al ejecutar el script SQL. Si usas SQLite, se crea al iniciar la aplicación por primera vez.

## 📱 Uso de la Aplicación

1. Acceder a la URL de tu aplicación
2. Iniciar sesión con las credenciales por defecto o registrar un nuevo usuario
3. Crear proyectos y tareas
4. Gestionar usuarios (solo administradores)

## 🔧 Estructura del Proyecto

```
project-planner/
├── backend/
│   ├── main.py              # API FastAPI
│   ├── requirements.txt     # Dependencias Python
│   └── Dockerfile          # Configuración Docker
├── frontend/
│   └── nginx.conf          # Configuración Nginx
├── index.html              # Página principal del planner
├── login.html              # Página de login
├── login.js                # Lógica de autenticación
├── api.js                  # Cliente API
├── script.js               # Lógica principal
├── styles.css              # Estilos CSS
├── docker-compose.yml      # Configuración Docker Compose
└── README.md               # Este archivo
```

## 🔒 Seguridad

- Cambiar la `SECRET_KEY` en producción
- Usar HTTPS en producción
- Configurar CORS apropiadamente
- Considerar usar PostgreSQL para mayor robustez

## 🐛 Solución de Problemas

### Error de CORS
Si tienes problemas de CORS, asegúrate de que el frontend esté configurado para usar la URL correcta del backend en `api.js`:

```javascript
const API_BASE_URL = 'https://tu-backend-url.com/api';
```

### Base de datos no se crea
Verifica que el directorio `backend/data` tenga permisos de escritura.

### Token expirado
Los tokens JWT expiran en 30 minutos. Los usuarios necesitarán volver a iniciar sesión.

## 🎯 Próximas Mejoras

- [ ] Notificaciones en tiempo real
- [ ] Exportación a PDF
- [ ] Integración con calendarios
- [ ] Aplicación móvil
- [ ] Colaboración en tiempo real