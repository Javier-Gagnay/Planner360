# 🚀 Guía Completa de Supabase para Project Planner

## 📋 Resumen

Esta guía te ayudará a configurar y usar Supabase como base de datos para tu aplicación Project Planner. Supabase proporciona una base de datos PostgreSQL escalable, autenticación, Row Level Security (RLS) y actualizaciones en tiempo real.

## 🎯 ¿Qué se ha implementado?

### ✅ Base de Datos Completa
- **8 tablas principales**: users, categories, projects, tasks, comments, attachments, notifications, activity_log
- **Relaciones completas** entre todas las entidades
- **Índices optimizados** para consultas rápidas
- **Funciones y triggers** para lógica de negocio automática
- **Datos por defecto** (categorías y usuario admin)

### ✅ Seguridad Avanzada
- **Row Level Security (RLS)** en todas las tablas
- **Políticas de acceso** granulares por usuario
- **Autenticación JWT** integrada
- **Hashing de contraseñas** con bcrypt

### ✅ Backend Actualizado
- **API completa** con FastAPI
- **Integración nativa** con Supabase
- **Manejo de errores** robusto
- **Configuración por variables de entorno**

### ✅ Herramientas de Migración
- **Script de migración** automática desde SQLite
- **Suite de pruebas** para verificar funcionalidad
- **Backup automático** de datos existentes

## 🛠️ Configuración Paso a Paso

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto:
   - **Nombre**: Project Planner
   - **Región**: Elige la más cercana a tus usuarios
   - **Plan**: Puedes empezar con el plan gratuito

### 2. Obtener Credenciales

En tu proyecto de Supabase:

1. Ve a **Settings** → **API**
2. Copia las siguientes credenciales:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/`:

```env
# Supabase Configuration
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# JWT Configuration
SECRET_KEY=tu_secret_key_super_seguro_aqui
ENVIRONMENT=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000

# Optional
DATABASE_URL=postgresql://...
PORT=8001
```

### 4. Ejecutar Schema SQL

1. En Supabase, ve a **SQL Editor**
2. Crea una nueva query
3. Copia y pega el contenido de `backend/supabase_schema.sql`
4. Ejecuta el script (puede tomar unos segundos)

### 5. Instalar Dependencias

```bash
cd backend
pip install -r requirements.txt
```

### 6. Probar Configuración

```bash
# Ejecutar suite de pruebas
python test_supabase.py
```

Este script verificará:
- ✅ Conexión con Supabase
- ✅ Estructura de todas las tablas
- ✅ Funcionalidad CRUD
- ✅ Políticas RLS
- ✅ Utilidades de base de datos

### 7. Migrar Datos (Opcional)

Si tienes datos en SQLite:

```bash
# Migrar automáticamente
python migrate_to_supabase.py
```

Este script:
- 📦 Crea backup de SQLite
- 🔄 Migra usuarios, proyectos y tareas
- 🔧 Configura la app para usar Supabase
- ✅ Verifica la migración

### 8. Iniciar Aplicación

```bash
# Backend (puerto 8001)
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Frontend (puerto 8000)
# En otra terminal, desde la raíz del proyecto:
python -m http.server 8000
```

## 🔐 Credenciales por Defecto

Después de ejecutar el schema SQL, tendrás un usuario admin:

- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Email**: `admin@planner.com`
- **Rol**: `admin`

> ⚠️ **Importante**: Cambia estas credenciales en producción

## 📊 Estructura de la Base de Datos

### Tablas Principales

| Tabla | Descripción | Campos Clave |
|-------|-------------|---------------|
| `users` | Usuarios del sistema | id, name, username, email, role |
| `categories` | Categorías de proyectos | id, name, color, icon |
| `projects` | Proyectos principales | id, name, description, status, priority |
| `tasks` | Tareas de proyectos | id, title, project_id, status, priority |
| `comments` | Comentarios en tareas | id, task_id, user_id, content |
| `attachments` | Archivos adjuntos | id, task_id, filename, file_url |
| `notifications` | Notificaciones | id, user_id, title, message |
| `activity_log` | Registro de actividad | id, user_id, action, entity_type |

### Relaciones

```
users (1) ←→ (N) projects
projects (1) ←→ (N) tasks
tasks (1) ←→ (N) comments
tasks (1) ←→ (N) attachments
users (1) ←→ (N) notifications
users (1) ←→ (N) activity_log
```

## 🔒 Row Level Security (RLS)

Todas las tablas tienen políticas RLS configuradas:

### Políticas Implementadas

- **users**: Los usuarios pueden ver y editar su propio perfil
- **projects**: Los usuarios pueden ver proyectos donde están asignados
- **tasks**: Acceso basado en permisos del proyecto
- **comments**: Solo el autor puede editar/eliminar
- **attachments**: Acceso basado en permisos de la tarea
- **notifications**: Solo el destinatario puede ver
- **activity_log**: Solo lectura para el usuario propietario

## 🚀 Funciones Automáticas

### Triggers Implementados

1. **updated_at**: Actualiza automáticamente el timestamp en modificaciones
2. **calculate_project_progress**: Calcula progreso basado en tareas completadas
3. **log_activity**: Registra automáticamente actividades importantes

### Funciones Disponibles

- `update_updated_at_column()`: Actualiza timestamp automáticamente
- `calculate_project_progress(project_id)`: Calcula progreso del proyecto
- `log_user_activity()`: Registra actividad del usuario

## 🔧 API Endpoints Disponibles

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar usuario
- `GET /auth/me` - Obtener perfil actual

### Proyectos
- `GET /projects` - Listar proyectos
- `POST /projects` - Crear proyecto
- `GET /projects/{id}` - Obtener proyecto
- `PUT /projects/{id}` - Actualizar proyecto
- `DELETE /projects/{id}` - Eliminar proyecto

### Tareas
- `GET /projects/{project_id}/tasks` - Listar tareas
- `POST /projects/{project_id}/tasks` - Crear tarea
- `GET /tasks/{id}` - Obtener tarea
- `PUT /tasks/{id}` - Actualizar tarea
- `DELETE /tasks/{id}` - Eliminar tarea

### Categorías
- `GET /categories` - Listar categorías

## 🐳 Despliegue con Docker

### docker-compose.yml

El archivo ya está configurado con las variables de Supabase:

```yaml
services:
  backend:
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      # ... otras variables
```

### Desplegar

```bash
# Configurar variables en .env
# Luego ejecutar:
docker-compose up -d
```

## 🌐 Despliegue en Producción

### Opciones Recomendadas

1. **Vercel** (Frontend) + **Railway/Render** (Backend)
2. **Netlify** (Frontend) + **Heroku** (Backend)
3. **AWS/GCP/Azure** (Completo)
4. **VPS** con Docker

### Variables de Entorno en Producción

```env
ENVIRONMENT=production
SECRET_KEY=clave_super_segura_de_produccion
ALLOWED_ORIGINS=https://tu-dominio.com
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## 🔍 Troubleshooting

### Problemas Comunes

#### Error de Conexión
```
❌ No se pudo conectar con Supabase
```
**Solución**: Verifica las variables de entorno y que el proyecto esté activo

#### Error de Autenticación
```
❌ Invalid API key
```
**Solución**: Verifica que las keys sean correctas y no hayan expirado

#### Error de RLS
```
❌ Row Level Security policy violation
```
**Solución**: Verifica que las políticas RLS estén configuradas correctamente

#### Error de Migración
```
❌ Error en migración de usuarios
```
**Solución**: Verifica que el schema esté ejecutado y las tablas existan

### Comandos de Diagnóstico

```bash
# Probar conexión
python test_supabase.py

# Verificar variables de entorno
python -c "import os; print(os.getenv('SUPABASE_URL'))"

# Probar backend
curl http://localhost:8001/categories
```

## 📈 Monitoreo y Métricas

### Dashboard de Supabase

En tu proyecto de Supabase puedes monitorear:
- 📊 **Usage**: Requests, storage, bandwidth
- 🔍 **Logs**: Errores y actividad en tiempo real
- 📈 **Performance**: Tiempo de respuesta de queries
- 👥 **Auth**: Usuarios activos y registros

### Logs de la Aplicación

La aplicación registra automáticamente:
- 🔐 Intentos de login
- 📝 Creación/modificación de proyectos
- ✅ Completado de tareas
- 🚨 Errores de la aplicación

## 🔄 Actualizaciones y Mantenimiento

### Backup de Datos

Supabase hace backups automáticos, pero puedes crear backups manuales:

1. Ve a **Settings** → **Database**
2. Usa la opción **Backup**
3. O usa `pg_dump` para backups programáticos

### Actualizaciones de Schema

Para cambios en la base de datos:

1. Crea migration scripts
2. Prueba en entorno de desarrollo
3. Aplica en producción durante ventana de mantenimiento

### Escalabilidad

Supabase escala automáticamente, pero considera:
- **Índices** para queries complejas
- **Conexiones** para alta concurrencia
- **CDN** para archivos estáticos
- **Caching** para datos frecuentes

## 🎉 ¡Listo!

Tu aplicación Project Planner ahora está completamente configurada con Supabase. Tienes:

✅ Base de datos PostgreSQL escalable
✅ Autenticación y autorización robusta
✅ API REST completa
✅ Seguridad a nivel de fila
✅ Funciones automáticas
✅ Herramientas de migración
✅ Suite de pruebas
✅ Documentación completa

### Próximos Pasos Sugeridos

1. 🎨 **Personalizar UI**: Adapta el frontend a tu marca
2. 📱 **App Móvil**: Considera React Native o Flutter
3. 🔔 **Notificaciones**: Implementa push notifications
4. 📊 **Analytics**: Añade métricas de uso
5. 🤖 **Automatización**: Integra con herramientas externas
6. 🌍 **Internacionalización**: Soporte multi-idioma
7. 🔍 **Búsqueda**: Implementa búsqueda avanzada
8. 📈 **Reportes**: Dashboards de productividad

---

**¿Necesitas ayuda?** Consulta la [documentación oficial de Supabase](https://supabase.com/docs) o revisa los archivos de configuración incluidos.