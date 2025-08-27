# 🚀 Guía de Despliegue en Railway

## ✅ Preparación Completada

Tu proyecto ya está listo para Railway con:
- ✅ `railway.json` - Configuración de Railway
- ✅ `Procfile` - Comando de inicio
- ✅ `railway.env.example` - Variables de entorno
- ✅ Estructura de proyecto organizada
- ✅ Backend con Supabase configurado

## 🔧 Pasos para Desplegar

### 1. Instalar Railway CLI

```bash
# Opción 1: Con npm
npm install -g @railway/cli

# Opción 2: Con curl (Linux/Mac)
curl -fsSL https://railway.app/install.sh | sh

# Opción 3: Descargar desde https://railway.app/cli
```

### 2. Configurar Supabase (Si no lo has hecho)

1. Ve a [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a Settings > API
4. Copia:
   - `Project URL`
   - `anon public key`
   - `service_role key`
5. Ve a SQL Editor y ejecuta el contenido de `backend/supabase_schema.sql`

### 3. Desplegar en Railway

```bash
# 1. Login en Railway
railway login

# 2. Inicializar proyecto
railway init

# 3. Configurar variables de entorno
railway variables set SUPABASE_URL="https://tu-proyecto.supabase.co"
railway variables set SUPABASE_ANON_KEY="tu_clave_anonima"
railway variables set SUPABASE_SERVICE_ROLE_KEY="tu_clave_servicio"
railway variables set SECRET_KEY="tu_clave_secreta_muy_segura"
railway variables set JWT_SECRET_KEY="tu_clave_jwt_muy_segura"
railway variables set ENVIRONMENT="production"

# 4. Desplegar
railway up
```

### 4. Configurar Dominio y CORS

```bash
# Después del despliegue, Railway te dará una URL como:
# https://tu-proyecto-production.up.railway.app

# Configurar CORS para permitir tu dominio
railway variables set ALLOWED_ORIGINS="https://tu-proyecto-production.up.railway.app"
```

## 🌐 Desplegar Frontend

### Opción 1: Vercel (Recomendado)

1. Ve a [Vercel](https://vercel.com)
2. Conecta tu repositorio GitHub
3. Configuración:
   - **Framework Preset**: Other
   - **Root Directory**: `frontend`
   - **Output Directory**: `src`
4. Variables de entorno:
   ```
   VITE_API_URL=https://tu-backend-railway.up.railway.app
   ```

### Opción 2: Netlify

1. Ve a [Netlify](https://netlify.com)
2. Conecta tu repositorio
3. Configuración:
   - **Base directory**: `frontend`
   - **Publish directory**: `src`

## 📋 Variables de Entorno Requeridas

### Backend (Railway)
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SECRET_KEY=tu_clave_secreta_muy_segura_de_al_menos_32_caracteres
JWT_SECRET_KEY=otra_clave_secreta_diferente_para_jwt
ENVIRONMENT=production
ALLOWED_ORIGINS=https://tu-frontend.vercel.app
```

### Frontend (Vercel/Netlify)
```env
VITE_API_URL=https://tu-backend.up.railway.app
```

## 🔍 Verificación del Despliegue

### 1. Verificar Backend
```bash
# Verificar que el backend esté funcionando
curl https://tu-backend.up.railway.app/

# Verificar documentación API
# Visita: https://tu-backend.up.railway.app/docs
```

### 2. Verificar Base de Datos
```bash
# Verificar categorías
curl https://tu-backend.up.railway.app/categories

# Debería devolver las categorías por defecto
```

### 3. Verificar Frontend
- Visita tu URL de frontend
- Prueba el login con:
  - Email: `admin@example.com`
  - Contraseña: `admin123`

## 🚨 Solución de Problemas

### Error: "SECRET_KEY debe ser configurado"
```bash
# Generar una clave secreta segura
railway variables set SECRET_KEY="$(openssl rand -base64 32)"
railway variables set JWT_SECRET_KEY="$(openssl rand -base64 32)"
```

### Error de CORS
```bash
# Actualizar CORS con tu dominio frontend
railway variables set ALLOWED_ORIGINS="https://tu-frontend.vercel.app,https://tu-backend.up.railway.app"
```

### Error de Conexión a Supabase
1. Verifica que las credenciales sean correctas
2. Asegúrate de que el SQL schema se ejecutó correctamente
3. Verifica que Supabase esté en la región correcta

### Ver Logs
```bash
# Ver logs en tiempo real
railway logs

# Ver logs específicos
railway logs --tail 100
```

## 💰 Costos de Railway

- **Plan Hobby**: $5 USD de crédito mensual
- **Uso típico**: ~$2-3 USD/mes para proyectos pequeños
- **Incluye**: 512MB RAM, 1GB almacenamiento, dominio personalizado

## 🎯 URLs Finales

Después del despliegue tendrás:
- **Backend API**: `https://tu-proyecto-production.up.railway.app`
- **Frontend**: `https://tu-proyecto.vercel.app`
- **Documentación**: `https://tu-proyecto-production.up.railway.app/docs`

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `railway logs`
2. Verifica las variables de entorno: `railway variables`
3. Consulta la documentación de Railway: https://docs.railway.app

¡Tu proyecto estará disponible públicamente en internet! 🌍