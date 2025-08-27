# Configuración del Proyecto

## Estructura del Proyecto

```
project-planner/
├── frontend/
│   ├── src/
│   │   ├── index.html
│   │   └── login.html
│   └── assets/
│       ├── styles.css
│       ├── script.js
│       ├── login.js
│       └── api.js
├── backend/
│   ├── main.py (SQLite)
│   ├── main_supabase.py (Supabase)
│   ├── supabase_config.py
│   ├── supabase_schema.sql
│   └── requirements.txt
├── docs/
│   ├── SUPABASE_SETUP.md
│   └── SUPABASE_COMPLETE_GUIDE.md
├── scripts/
│   └── migrate_to_supabase.py
├── tests/
│   └── test_supabase.py
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json
└── README.md
```

## Comandos Disponibles

### Desarrollo
- `npm run dev` - Inicia el servidor frontend
- `npm run backend` - Inicia el backend con SQLite
- `npm run backend-supabase` - Inicia el backend con Supabase

### Utilidades
- `npm run migrate` - Migra datos de SQLite a Supabase
- `npm run test` - Ejecuta pruebas de Supabase

### Docker
- `npm run docker-up` - Inicia contenedores Docker
- `npm run docker-down` - Detiene contenedores Docker

## URLs de Desarrollo

- Frontend: http://localhost:8000
- Backend API: http://localhost:8001
- Documentación API: http://localhost:8001/docs

## Configuración de Entorno

1. Copia `.env.example` a `.env`
2. Configura las variables de Supabase
3. Instala dependencias: `pip install -r backend/requirements.txt`

## Credenciales por Defecto

- **Usuario Admin:**
  - Email: admin@example.com
  - Contraseña: admin123

## Tecnologías

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** FastAPI, Python
- **Base de Datos:** Supabase (PostgreSQL) / SQLite
- **Autenticación:** JWT
- **Contenedores:** Docker