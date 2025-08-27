from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from supabase_config import supabase, db_utils
import uuid
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de seguridad
SECRET_KEY = os.getenv("SECRET_KEY", "your-fallback-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Verificar que SECRET_KEY no sea el valor por defecto en producción
if os.getenv("ENVIRONMENT") == "production" and SECRET_KEY == "your-fallback-secret-key":
    raise ValueError("SECRET_KEY debe ser configurado en producción")

# Configuración de CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8000").split(",")

app = FastAPI(title="Project Planner API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Configuración de autenticación
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Modelos Pydantic
class UserCreate(BaseModel):
    name: str
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    username: str
    email: str
    role: str
    profile_photo: str
    is_active: bool
    created_at: str

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    priority: Optional[str] = "medium"
    category_id: Optional[str] = None
    assigned_to: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    budget: Optional[float] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = None
    category_id: Optional[str] = None
    assigned_to: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    budget: Optional[float] = None
    is_archived: Optional[bool] = None

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: str
    parent_task_id: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[str] = "medium"
    due_date: Optional[str] = None
    start_date: Optional[str] = None
    estimated_hours: Optional[float] = None
    tags: Optional[List[str]] = []
    dependencies: Optional[List[str]] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = None
    due_date: Optional[str] = None
    start_date: Optional[str] = None
    completed_date: Optional[str] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    tags: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None

# Funciones de utilidad
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Endpoints de autenticación
@app.post("/auth/register")
async def register(user: UserCreate):
    try:
        # Verificar si el usuario ya existe
        existing_user = supabase.table("users").select("*").eq("username", user.username).execute()
        if existing_user.data:
            raise HTTPException(status_code=400, detail="El usuario ya existe")
        
        existing_email = supabase.table("users").select("*").eq("email", user.email).execute()
        if existing_email.data:
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        
        # Crear nuevo usuario
        hashed_password = hash_password(user.password)
        new_user_data = {
            "name": user.name,
            "username": user.username,
            "email": user.email,
            "password_hash": hashed_password,
            "role": "user"
        }
        
        result = supabase.table("users").insert(new_user_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al crear usuario")
        
        user_data = result.data[0]
        return {
            "message": "Usuario creado exitosamente",
            "user": db_utils.format_user_for_response(user_data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@app.post("/auth/login")
async def login(user: UserLogin):
    try:
        # Buscar usuario
        result = supabase.table("users").select("*").eq("username", user.username).execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        user_data = result.data[0]
        
        # Verificar contraseña
        if not verify_password(user.password, user_data["password_hash"]):
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        # Crear token de acceso
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_data["id"]}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": db_utils.format_user_for_response(user_data)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@app.get("/auth/me")
async def get_current_user(current_user_id: str = Depends(verify_token)):
    try:
        result = supabase.table("users").select("*").eq("id", current_user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        return db_utils.format_user_for_response(result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

# Endpoints de proyectos
@app.get("/projects")
async def get_projects(current_user_id: str = Depends(verify_token)):
    try:
        result = supabase.table("projects").select("*").or_(f"created_by.eq.{current_user_id},assigned_to.cs.{{{current_user_id}}}").execute()
        projects = [db_utils.format_project_for_response(project) for project in result.data]
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@app.post("/projects")
async def create_project(project: ProjectCreate, current_user_id: str = Depends(verify_token)):
    try:
        project_data = {
            "name": project.name,
            "description": project.description,
            "start_date": project.start_date,
            "end_date": project.end_date,
            "priority": project.priority,
            "category_id": project.category_id,
            "created_by": current_user_id,
            "assigned_to": project.assigned_to or [],
            "tags": project.tags or [],
            "budget": project.budget
        }
        
        result = supabase.table("projects").insert(project_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al crear proyecto")
        
        return db_utils.format_project_for_response(result.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@app.get("/projects/{project_id}")
async def get_project(project_id: str, current_user_id: str = Depends(verify_token)):
    try:
        result = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        project = result.data[0]
        
        # Verificar permisos
        if project["created_by"] != current_user_id and current_user_id not in project.get("assigned_to", []):
            raise HTTPException(status_code=403, detail="No tienes permisos para ver este proyecto")
        
        return db_utils.format_project_for_response(project)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@app.put("/projects/{project_id}")
async def update_project(project_id: str, project_update: ProjectUpdate, current_user_id: str = Depends(verify_token)):
    try:
        # Verificar que el proyecto existe y el usuario tiene permisos
        existing_project = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not existing_project.data:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        project = existing_project.data[0]
        if project["created_by"] != current_user_id:
            raise HTTPException(status_code=403, detail="No tienes permisos para modificar este proyecto")
        
        # Preparar datos de actualización
        update_data = {k: v for k, v in project_update.dict().items() if v is not None}
        
        if not update_data:
            return db_utils.format_project_for_response(project)
        
        result = supabase.table("projects").update(update_data).eq("id", project_id).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al actualizar proyecto")
        
        return db_utils.format_project_for_response(result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@app.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user_id: str = Depends(verify_token)):
    try:
        # Verificar que el proyecto existe y el usuario tiene permisos
        existing_project = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not existing_project.data:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        project = existing_project.data[0]
        if project["created_by"] != current_user_id:
            raise HTTPException(status_code=403, detail="No tienes permisos para eliminar este proyecto")
        
        # Eliminar proyecto (las tareas se eliminan en cascada)
        result = supabase.table("projects").delete().eq("id", project_id).execute()
        
        return {"message": "Proyecto eliminado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

# Endpoints de tareas
@app.get("/projects/{project_id}/tasks")
async def get_project_tasks(project_id: str, current_user_id: str = Depends(verify_token)):
    try:
        # Verificar permisos del proyecto
        project_result = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        project = project_result.data[0]
        if project["created_by"] != current_user_id and current_user_id not in project.get("assigned_to", []):
            raise HTTPException(status_code=403, detail="No tienes permisos para ver las tareas de este proyecto")
        
        # Obtener tareas del proyecto
        result = supabase.table("tasks").select("*").eq("project_id", project_id).execute()
        tasks = [db_utils.format_task_for_response(task) for task in result.data]
        return tasks
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@app.post("/tasks")
async def create_task(task: TaskCreate, current_user_id: str = Depends(verify_token)):
    try:
        # Verificar permisos del proyecto
        project_result = supabase.table("projects").select("*").eq("id", task.project_id).execute()
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        project = project_result.data[0]
        if project["created_by"] != current_user_id and current_user_id not in project.get("assigned_to", []):
            raise HTTPException(status_code=403, detail="No tienes permisos para crear tareas en este proyecto")
        
        task_data = {
            "title": task.title,
            "description": task.description,
            "project_id": task.project_id,
            "parent_task_id": task.parent_task_id,
            "assigned_to": task.assigned_to,
            "priority": task.priority,
            "due_date": task.due_date,
            "start_date": task.start_date,
            "estimated_hours": task.estimated_hours,
            "tags": task.tags or [],
            "dependencies": task.dependencies or [],
            "created_by": current_user_id
        }
        
        result = supabase.table("tasks").insert(task_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al crear tarea")
        
        return db_utils.format_task_for_response(result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@app.put("/tasks/{task_id}")
async def update_task(task_id: str, task_update: TaskUpdate, current_user_id: str = Depends(verify_token)):
    try:
        # Verificar que la tarea existe
        existing_task = supabase.table("tasks").select("*").eq("id", task_id).execute()
        if not existing_task.data:
            raise HTTPException(status_code=404, detail="Tarea no encontrada")
        
        task = existing_task.data[0]
        
        # Verificar permisos del proyecto
        project_result = supabase.table("projects").select("*").eq("id", task["project_id"]).execute()
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        project = project_result.data[0]
        if (project["created_by"] != current_user_id and 
            current_user_id not in project.get("assigned_to", []) and 
            task["assigned_to"] != current_user_id):
            raise HTTPException(status_code=403, detail="No tienes permisos para modificar esta tarea")
        
        # Preparar datos de actualización
        update_data = {k: v for k, v in task_update.dict().items() if v is not None}
        
        if not update_data:
            return db_utils.format_task_for_response(task)
        
        # Si se marca como completada, agregar fecha de completado
        if update_data.get("status") == "completed" and not update_data.get("completed_date"):
            update_data["completed_date"] = datetime.utcnow().isoformat()
        
        result = supabase.table("tasks").update(update_data).eq("id", task_id).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Error al actualizar tarea")
        
        return db_utils.format_task_for_response(result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user_id: str = Depends(verify_token)):
    try:
        # Verificar que la tarea existe
        existing_task = supabase.table("tasks").select("*").eq("id", task_id).execute()
        if not existing_task.data:
            raise HTTPException(status_code=404, detail="Tarea no encontrada")
        
        task = existing_task.data[0]
        
        # Verificar permisos del proyecto
        project_result = supabase.table("projects").select("*").eq("id", task["project_id"]).execute()
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        project = project_result.data[0]
        if project["created_by"] != current_user_id:
            raise HTTPException(status_code=403, detail="No tienes permisos para eliminar esta tarea")
        
        # Eliminar tarea
        result = supabase.table("tasks").delete().eq("id", task_id).execute()
        
        return {"message": "Tarea eliminada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

# Endpoint de categorías
@app.get("/categories")
async def get_categories(current_user_id: str = Depends(verify_token)):
    try:
        result = supabase.table("categories").select("*").execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

# Endpoint de salud
@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "supabase", "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)