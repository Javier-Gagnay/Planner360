# Configuración de Supabase para Project Planner

Esta guía te ayudará a configurar Supabase como base de datos para tu aplicación Project Planner.

## 📋 Requisitos Previos

- Cuenta en [Supabase](https://supabase.com)
- Acceso a internet
- Proyecto Project Planner configurado localmente

## 🚀 Paso 1: Crear Proyecto en Supabase

1. **Accede a Supabase Dashboard**
   - Ve a [https://supabase.com](https://supabase.com)
   - Inicia sesión o crea una cuenta

2. **Crear Nuevo Proyecto**
   - Haz clic en "New Project"
   - Selecciona tu organización
   - Completa los datos:
     - **Name**: `project-planner`
     - **Database Password**: Genera una contraseña segura (guárdala)
     - **Region**: Selecciona la más cercana a tu ubicación
   - Haz clic en "Create new project"

3. **Esperar Inicialización**
   - El proyecto tardará 1-2 minutos en estar listo
   - Verás un indicador de progreso

## 🔑 Paso 2: Obtener Credenciales

1. **Acceder a Settings**
   - En el dashboard de tu proyecto, ve a "Settings" → "API"

2. **Copiar Credenciales**
   - **Project URL**: `https://tu-proyecto-ref.supabase.co`
   - **anon public key**: Clave pública para el cliente
   - **service_role secret**: Clave secreta para operaciones administrativas

3. **Configurar Variables de Entorno**
   - Copia el archivo `.env.example` a `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
   
   - Edita `backend/.env` con tus credenciales:
   ```env
   # Configuración de seguridad JWT
   SECRET_KEY=tu-clave-jwt-super-secreta-cambiar-en-produccion
   
   # Entorno de ejecución
   ENVIRONMENT=development
   
   # CORS - Orígenes permitidos
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000,http://127.0.0.1:8000
   
   # Configuración de Supabase
   SUPABASE_URL=https://tu-proyecto-ref.supabase.co
   SUPABASE_ANON_KEY=tu-clave-anon-aqui
   SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role-aqui
   ```

## 🗄️ Paso 3: Crear Esquema de Base de Datos

1. **Acceder al SQL Editor**
   - En el dashboard de Supabase, ve a "SQL Editor"
   - Haz clic en "New query"

2. **Ejecutar Script de Esquema**
   - Copia todo el contenido del archivo `backend/supabase_schema.sql`
   - Pégalo en el editor SQL
   - Haz clic en "Run" para ejecutar

3. **Verificar Creación de Tablas**
   - Ve a "Table Editor" en el dashboard
   - Deberías ver las siguientes tablas:
     - `users`
     - `categories`
     - `projects`
     - `tasks`
     - `comments`
     - `attachments`
     - `notifications`
     - `activity_log`

## 🔧 Paso 4: Instalar Dependencias

1. **Instalar Nuevas Dependencias**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Verificar Instalación**
   - Las nuevas dependencias incluyen:
     - `supabase`: Cliente oficial de Supabase
     - `psycopg2-binary`: Driver de PostgreSQL
     - `python-dotenv`: Para cargar variables de entorno

## 🔄 Paso 5: Migrar a Supabase

1. **Respaldar Archivo Actual**
   ```bash
   cd backend
   cp main.py main_sqlite_backup.py
   ```

2. **Reemplazar con Versión Supabase**
   ```bash
   cp main_supabase.py main.py
   ```

3. **Verificar Configuración**
   - Asegúrate de que el archivo `.env` esté configurado correctamente
   - Verifica que todas las credenciales sean correctas

## 🧪 Paso 6: Probar la Aplicación

1. **Iniciar Servidor Backend**
   ```bash
   cd backend
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
   ```

2. **Verificar Conexión**
   - Abre tu navegador en `http://localhost:8001/health`
   - Deberías ver: `{"status": "healthy", "database": "supabase", "version": "2.0.0"}`

3. **Probar Autenticación**
   - Ve a `http://localhost:8000/login.html`
   - Intenta registrar un nuevo usuario
   - Inicia sesión con las credenciales por defecto:
     - **Usuario**: `admin123`
     - **Contraseña**: `admin123`

## 🔐 Paso 7: Configurar Row Level Security (RLS)

Las políticas de RLS ya están configuradas en el script SQL, pero puedes verificarlas:

1. **Verificar Políticas**
   - En Supabase Dashboard, ve a "Authentication" → "Policies"
   - Deberías ver políticas para cada tabla

2. **Políticas Principales**:
   - **Users**: Solo pueden ver/editar su propio perfil
   - **Projects**: Solo creadores y asignados pueden ver/editar
   - **Tasks**: Solo usuarios con acceso al proyecto pueden ver/editar
   - **Comments**: Solo usuarios con acceso al proyecto/tarea pueden ver

## 📊 Paso 8: Verificar Datos Iniciales

1. **Categorías por Defecto**
   - Ve a "Table Editor" → "categories"
   - Deberías ver 5 categorías predefinidas:
     - Desarrollo
     - Marketing
     - Diseño
     - Investigación
     - General

2. **Usuario Administrador**
   - Ve a "Table Editor" → "users"
   - Deberías ver el usuario administrador:
     - **Username**: `admin123`
     - **Email**: `admin@planner.com`
     - **Role**: `admin`

## 🚀 Paso 9: Despliegue en Producción

### Opción A: Railway

1. **Configurar Variables de Entorno**
   ```bash
   SUPABASE_URL=https://tu-proyecto-ref.supabase.co
   SUPABASE_ANON_KEY=tu-clave-anon
   SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role
   SECRET_KEY=tu-clave-jwt-super-secreta
   ENVIRONMENT=production
   ALLOWED_ORIGINS=https://tu-dominio.com
   ```

### Opción B: Vercel

1. **Configurar en vercel.json**
   ```json
   {
     "env": {
       "SUPABASE_URL": "https://tu-proyecto-ref.supabase.co",
       "SUPABASE_ANON_KEY": "tu-clave-anon",
       "SUPABASE_SERVICE_ROLE_KEY": "tu-clave-service-role",
       "SECRET_KEY": "tu-clave-jwt-super-secreta",
       "ENVIRONMENT": "production"
     }
   }
   ```

## 🔍 Solución de Problemas

### Error: "ModuleNotFoundError: No module named 'supabase'"
```bash
cd backend
pip install supabase psycopg2-binary python-dotenv
```

### Error: "SUPABASE_URL y SUPABASE_ANON_KEY son requeridos"
- Verifica que el archivo `.env` esté en la carpeta `backend/`
- Asegúrate de que las variables estén configuradas correctamente
- Reinicia el servidor después de cambiar las variables

### Error de Conexión a Supabase
- Verifica que las credenciales sean correctas
- Asegúrate de que el proyecto de Supabase esté activo
- Verifica tu conexión a internet

### Error: "Token inválido"
- Verifica que `SECRET_KEY` esté configurado
- Asegúrate de que el token no haya expirado
- Intenta hacer logout y login nuevamente

## 📈 Funcionalidades Adicionales de Supabase

### 1. Realtime (Tiempo Real)
```javascript
// En el frontend, puedes suscribirte a cambios en tiempo real
supabase
  .channel('projects')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, payload => {
    console.log('Cambio en proyecto:', payload)
  })
  .subscribe()
```

### 2. Storage (Almacenamiento de Archivos)
```python
# Subir archivos
with open('archivo.pdf', 'rb') as f:
    supabase.storage.from_('attachments').upload('proyecto1/archivo.pdf', f)
```

### 3. Edge Functions
- Funciones serverless para lógica compleja
- Triggers automáticos
- Procesamiento de datos

## 🎯 Próximos Pasos

1. **Implementar Notificaciones en Tiempo Real**
2. **Agregar Sistema de Archivos con Supabase Storage**
3. **Configurar Backup Automático**
4. **Implementar Analytics con Supabase**
5. **Agregar Autenticación Social (Google, GitHub)**

## 📞 Soporte

- **Documentación Supabase**: [https://supabase.com/docs](https://supabase.com/docs)
- **Comunidad**: [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
- **Discord**: [https://discord.supabase.com](https://discord.supabase.com)

---

¡Felicidades! 🎉 Tu aplicación Project Planner ahora está funcionando con Supabase como base de datos en la nube.