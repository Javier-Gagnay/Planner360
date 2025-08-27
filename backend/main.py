from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import hashlib
import jwt
import datetime
from contextlib import contextmanager
import os

app = FastAPI(title="Project Planner API", version="1.0.0")

# Configuración CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Configuración JWT
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-please")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Validar que SECRET_KEY no sea la por defecto en producción
if SECRET_KEY == "your-secret-key-change-in-production-please" and os.getenv("ENVIRONMENT") == "production":
    raise ValueError("SECRET_KEY debe ser configurada en producción")

security = HTTPBearer()

# Modelos Pydantic
class UserCreate(BaseModel):
    name: str
    username: str
    email: str
    password: str
    confirmPassword: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    username: str
    email: str
    role: str
    profilePhoto: str
    createdAt: str

class ProjectCreate(BaseModel):
    name: str
    description: str
    startDate: str
    endDate: str
    priority: str
    status: str

class TaskCreate(BaseModel):
    title: str
    description: str
    assignedTo: str
    priority: str
    status: str
    dueDate: str
    projectId: str

# Funciones de utilidad
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

# Gestión de base de datos
@contextmanager
def get_db():
    conn = sqlite3.connect('planner.db')
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        # Tabla de usuarios
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                profilePhoto TEXT DEFAULT '',
                createdAt TEXT NOT NULL
            )
        ''')
        
        # Tabla de proyectos
        conn.execute('''
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                startDate TEXT,
                endDate TEXT,
                priority TEXT,
                status TEXT,
                createdBy TEXT,
                createdAt TEXT NOT NULL,
                FOREIGN KEY (createdBy) REFERENCES users (id)
            )
        ''')
        
        # Tabla de tareas
        conn.execute('''
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                assignedTo TEXT,
                priority TEXT,
                status TEXT,
                dueDate TEXT,
                projectId TEXT,
                createdAt TEXT NOT NULL,
                FOREIGN KEY (projectId) REFERENCES projects (id)
            )
        ''')
        
        conn.commit()
        
        # Crear usuario admin por defecto
        cursor = conn.execute("SELECT * FROM users WHERE username = ?", ("admin123",))
        if not cursor.fetchone():
            admin_id = f"admin_{int(datetime.datetime.now().timestamp() * 1000)}"
            conn.execute(
                "INSERT INTO users (id, name, username, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (admin_id, "Administrador", "admin123", "admin@planner.com", 
                 hash_password("admin123"), "admin", datetime.datetime.now().isoformat())
            )
            conn.commit()

# Endpoints de autenticación
@app.post("/api/auth/register")
async def register(user: UserCreate):
    if user.password != user.confirmPassword:
        raise HTTPException(status_code=400, detail="Las contraseñas no coinciden")
    
    with get_db() as conn:
        # Verificar si el usuario ya existe
        cursor = conn.execute("SELECT * FROM users WHERE username = ? OR email = ?", 
                            (user.username, user.email))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="El usuario o email ya existe")
        
        # Crear nuevo usuario
        user_id = f"user_{int(datetime.datetime.now().timestamp() * 1000)}"
        conn.execute(
            "INSERT INTO users (id, name, username, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user_id, user.name, user.username, user.email, 
             hash_password(user.password), "user", datetime.datetime.now().isoformat())
        )
        conn.commit()
        
        return {"success": True, "message": "Usuario registrado exitosamente"}

@app.post("/api/auth/login")
async def login(user: UserLogin):
    with get_db() as conn:
        cursor = conn.execute(
            "SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?",
            (user.username, user.username, hash_password(user.password))
        )
        db_user = cursor.fetchone()
        
        if not db_user:
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
        
        # Crear token JWT
        access_token = create_access_token(data={"sub": db_user["id"]})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": db_user["id"],
                "name": db_user["name"],
                "username": db_user["username"],
                "email": db_user["email"],
                "role": db_user["role"],
                "profilePhoto": db_user["profilePhoto"]
            }
        }

@app.get("/api/auth/me")
async def get_current_user(user_id: str = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        return {
            "id": user["id"],
            "name": user["name"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "profilePhoto": user["profilePhoto"]
        }

# Endpoints de proyectos
@app.get("/api/projects")
async def get_projects(user_id: str = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM projects ORDER BY createdAt DESC")
        projects = [dict(row) for row in cursor.fetchall()]
        return projects

@app.post("/api/projects")
async def create_project(project: ProjectCreate, user_id: str = Depends(verify_token)):
    with get_db() as conn:
        project_id = f"project_{int(datetime.datetime.now().timestamp() * 1000)}"
        conn.execute(
            "INSERT INTO projects (id, name, description, startDate, endDate, priority, status, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (project_id, project.name, project.description, project.startDate, 
             project.endDate, project.priority, project.status, user_id, 
             datetime.datetime.now().isoformat())
        )
        conn.commit()
        return {"success": True, "id": project_id}

# Endpoints de tareas
@app.get("/api/tasks")
async def get_tasks(project_id: Optional[str] = None, user_id: str = Depends(verify_token)):
    with get_db() as conn:
        if project_id:
            cursor = conn.execute("SELECT * FROM tasks WHERE projectId = ? ORDER BY createdAt DESC", (project_id,))
        else:
            cursor = conn.execute("SELECT * FROM tasks ORDER BY createdAt DESC")
        tasks = [dict(row) for row in cursor.fetchall()]
        return tasks

@app.post("/api/tasks")
async def create_task(task: TaskCreate, user_id: str = Depends(verify_token)):
    with get_db() as conn:
        task_id = f"task_{int(datetime.datetime.now().timestamp() * 1000)}"
        conn.execute(
            "INSERT INTO tasks (id, title, description, assignedTo, priority, status, dueDate, projectId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (task_id, task.title, task.description, task.assignedTo, 
             task.priority, task.status, task.dueDate, task.projectId,
             datetime.datetime.now().isoformat())
        )
        conn.commit()
        return {"success": True, "id": task_id}

# Inicializar la aplicación
@app.on_event("startup")
async def startup_event():
    init_db()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)