# Configuración de Supabase para Project Planner
import os
from supabase import create_client, Client
from typing import Optional

class SupabaseConfig:
    def __init__(self):
        self.url: str = os.getenv('SUPABASE_URL', '')
        # Intentar ambos nombres de variable para compatibilidad
        self.key: str = os.getenv('SUPABASE_ANON_KEY', '') or os.getenv('SUPABASE_KEY', '')
        self.service_role_key: str = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
        
        if not self.url or not self.key:
            raise ValueError(
                "SUPABASE_URL y SUPABASE_ANON_KEY (o SUPABASE_KEY) son requeridos. "
                "Por favor configúralos en las variables de entorno."
            )
    
    def get_client(self, use_service_role: bool = False) -> Client:
        """Obtiene el cliente de Supabase
        
        Args:
            use_service_role: Si True, usa la service role key para operaciones administrativas
        
        Returns:
            Cliente de Supabase configurado
        """
        key = self.service_role_key if use_service_role and self.service_role_key else self.key
        return create_client(self.url, key)

# Instancia global de configuración
supabase_config = SupabaseConfig()

# Cliente principal (con anon key)
supabase: Client = supabase_config.get_client()

# Cliente administrativo (con service role key) - solo para operaciones que lo requieran
def get_admin_client() -> Optional[Client]:
    """Obtiene cliente administrativo si está configurado"""
    try:
        return supabase_config.get_client(use_service_role=True)
    except:
        return None

# Funciones de utilidad para la base de datos
class DatabaseUtils:
    @staticmethod
    def handle_supabase_response(response):
        """Maneja la respuesta de Supabase y extrae los datos"""
        if hasattr(response, 'data') and response.data is not None:
            return response.data
        elif hasattr(response, 'error') and response.error:
            raise Exception(f"Error de Supabase: {response.error}")
        else:
            return response
    
    @staticmethod
    def format_user_for_response(user_data: dict) -> dict:
        """Formatea los datos del usuario para la respuesta de la API"""
        if not user_data:
            return {}
        
        return {
            "id": user_data.get("id"),
            "name": user_data.get("name"),
            "username": user_data.get("username"),
            "email": user_data.get("email"),
            "role": user_data.get("role", "user"),
            "profile_photo": user_data.get("profile_photo", ""),
            "is_active": user_data.get("is_active", True),
            "created_at": user_data.get("created_at")
        }
    
    @staticmethod
    def format_project_for_response(project_data: dict) -> dict:
        """Formatea los datos del proyecto para la respuesta de la API"""
        if not project_data:
            return {}
        
        return {
            "id": project_data.get("id"),
            "name": project_data.get("name"),
            "description": project_data.get("description"),
            "start_date": project_data.get("start_date"),
            "end_date": project_data.get("end_date"),
            "priority": project_data.get("priority", "medium"),
            "status": project_data.get("status", "planning"),
            "progress": project_data.get("progress", 0),
            "budget": project_data.get("budget"),
            "category_id": project_data.get("category_id"),
            "created_by": project_data.get("created_by"),
            "assigned_to": project_data.get("assigned_to", []),
            "tags": project_data.get("tags", []),
            "is_archived": project_data.get("is_archived", False),
            "created_at": project_data.get("created_at"),
            "updated_at": project_data.get("updated_at")
        }
    
    @staticmethod
    def format_task_for_response(task_data: dict) -> dict:
        """Formatea los datos de la tarea para la respuesta de la API"""
        if not task_data:
            return {}
        
        return {
            "id": task_data.get("id"),
            "title": task_data.get("title"),
            "description": task_data.get("description"),
            "project_id": task_data.get("project_id"),
            "parent_task_id": task_data.get("parent_task_id"),
            "assigned_to": task_data.get("assigned_to"),
            "priority": task_data.get("priority", "medium"),
            "status": task_data.get("status", "todo"),
            "progress": task_data.get("progress", 0),
            "due_date": task_data.get("due_date"),
            "start_date": task_data.get("start_date"),
            "completed_date": task_data.get("completed_date"),
            "estimated_hours": task_data.get("estimated_hours"),
            "actual_hours": task_data.get("actual_hours"),
            "tags": task_data.get("tags", []),
            "dependencies": task_data.get("dependencies", []),
            "created_by": task_data.get("created_by"),
            "created_at": task_data.get("created_at"),
            "updated_at": task_data.get("updated_at")
        }

# Instancia global de utilidades
db_utils = DatabaseUtils()