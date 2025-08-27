#!/usr/bin/env python3
"""
Script de migración de SQLite a Supabase para Project Planner

Este script ayuda a migrar datos existentes de SQLite a Supabase
y configura la aplicación para usar Supabase como base de datos principal.
"""

import os
import sys
import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

try:
    from supabase_config import supabase, db_utils
except ImportError:
    print("❌ Error: No se pudo importar supabase_config.")
    print("Asegúrate de que las dependencias estén instaladas:")
    print("pip install supabase psycopg2-binary python-dotenv")
    sys.exit(1)

class SQLiteToSupabaseMigrator:
    def __init__(self, sqlite_db_path: str = "planner.db"):
        self.sqlite_db_path = sqlite_db_path
        self.supabase = supabase
        
    def check_sqlite_exists(self) -> bool:
        """Verifica si existe la base de datos SQLite"""
        return os.path.exists(self.sqlite_db_path)
    
    def check_supabase_connection(self) -> bool:
        """Verifica la conexión con Supabase"""
        try:
            result = self.supabase.table("categories").select("count", count="exact").execute()
            return True
        except Exception as e:
            print(f"❌ Error conectando con Supabase: {e}")
            return False
    
    def get_sqlite_data(self, table_name: str) -> List[Dict[str, Any]]:
        """Obtiene datos de una tabla SQLite"""
        if not self.check_sqlite_exists():
            return []
        
        try:
            conn = sqlite3.connect(self.sqlite_db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()
            
            data = [dict(row) for row in rows]
            conn.close()
            
            return data
        except sqlite3.Error as e:
            print(f"❌ Error leyendo tabla {table_name}: {e}")
            return []
    
    def migrate_users(self) -> bool:
        """Migra usuarios de SQLite a Supabase"""
        print("📤 Migrando usuarios...")
        
        sqlite_users = self.get_sqlite_data("users")
        if not sqlite_users:
            print("ℹ️  No hay usuarios en SQLite para migrar")
            return True
        
        try:
            for user in sqlite_users:
                # Verificar si el usuario ya existe
                existing = self.supabase.table("users").select("id").eq("username", user["username"]).execute()
                
                if existing.data:
                    print(f"⚠️  Usuario {user['username']} ya existe, omitiendo...")
                    continue
                
                # Preparar datos del usuario
                user_data = {
                    "name": user.get("name", user["username"]),
                    "username": user["username"],
                    "email": user.get("email", f"{user['username']}@planner.com"),
                    "password_hash": user["password_hash"],
                    "role": user.get("role", "user")
                }
                
                # Insertar en Supabase
                result = self.supabase.table("users").insert(user_data).execute()
                
                if result.data:
                    print(f"✅ Usuario {user['username']} migrado exitosamente")
                else:
                    print(f"❌ Error migrando usuario {user['username']}")
                    return False
            
            return True
        except Exception as e:
            print(f"❌ Error en migración de usuarios: {e}")
            return False
    
    def migrate_projects(self) -> bool:
        """Migra proyectos de SQLite a Supabase"""
        print("📤 Migrando proyectos...")
        
        sqlite_projects = self.get_sqlite_data("projects")
        if not sqlite_projects:
            print("ℹ️  No hay proyectos en SQLite para migrar")
            return True
        
        try:
            # Crear mapeo de usuarios SQLite a Supabase
            user_mapping = self.create_user_mapping()
            
            for project in sqlite_projects:
                # Mapear created_by a UUID de Supabase
                created_by_uuid = user_mapping.get(project["created_by"])
                if not created_by_uuid:
                    print(f"⚠️  No se encontró usuario para proyecto {project['name']}, omitiendo...")
                    continue
                
                # Preparar datos del proyecto
                project_data = {
                    "name": project["name"],
                    "description": project.get("description"),
                    "priority": project.get("priority", "medium"),
                    "status": project.get("status", "planning"),
                    "progress": project.get("progress", 0),
                    "created_by": created_by_uuid,
                    "assigned_to": [],  # Se puede expandir si hay datos
                    "tags": []  # Se puede expandir si hay datos
                }
                
                # Insertar en Supabase
                result = self.supabase.table("projects").insert(project_data).execute()
                
                if result.data:
                    print(f"✅ Proyecto '{project['name']}' migrado exitosamente")
                else:
                    print(f"❌ Error migrando proyecto '{project['name']}'")
                    return False
            
            return True
        except Exception as e:
            print(f"❌ Error en migración de proyectos: {e}")
            return False
    
    def migrate_tasks(self) -> bool:
        """Migra tareas de SQLite a Supabase"""
        print("📤 Migrando tareas...")
        
        sqlite_tasks = self.get_sqlite_data("tasks")
        if not sqlite_tasks:
            print("ℹ️  No hay tareas en SQLite para migrar")
            return True
        
        try:
            # Crear mapeos necesarios
            user_mapping = self.create_user_mapping()
            project_mapping = self.create_project_mapping()
            
            for task in sqlite_tasks:
                # Mapear project_id y created_by
                project_uuid = project_mapping.get(task["project_id"])
                created_by_uuid = user_mapping.get(task.get("created_by"))
                
                if not project_uuid:
                    print(f"⚠️  No se encontró proyecto para tarea {task['title']}, omitiendo...")
                    continue
                
                # Preparar datos de la tarea
                task_data = {
                    "title": task["title"],
                    "description": task.get("description"),
                    "project_id": project_uuid,
                    "priority": task.get("priority", "medium"),
                    "status": task.get("status", "todo"),
                    "progress": task.get("progress", 0),
                    "created_by": created_by_uuid,
                    "tags": [],
                    "dependencies": []
                }
                
                # Insertar en Supabase
                result = self.supabase.table("tasks").insert(task_data).execute()
                
                if result.data:
                    print(f"✅ Tarea '{task['title']}' migrada exitosamente")
                else:
                    print(f"❌ Error migrando tarea '{task['title']}'")
                    return False
            
            return True
        except Exception as e:
            print(f"❌ Error en migración de tareas: {e}")
            return False
    
    def create_user_mapping(self) -> Dict[int, str]:
        """Crea mapeo de IDs SQLite a UUIDs Supabase para usuarios"""
        mapping = {}
        
        # Obtener usuarios de SQLite
        sqlite_users = self.get_sqlite_data("users")
        
        for sqlite_user in sqlite_users:
            # Buscar usuario correspondiente en Supabase
            supabase_user = self.supabase.table("users").select("id").eq("username", sqlite_user["username"]).execute()
            
            if supabase_user.data:
                mapping[sqlite_user["id"]] = supabase_user.data[0]["id"]
        
        return mapping
    
    def create_project_mapping(self) -> Dict[int, str]:
        """Crea mapeo de IDs SQLite a UUIDs Supabase para proyectos"""
        mapping = {}
        
        # Obtener proyectos de SQLite
        sqlite_projects = self.get_sqlite_data("projects")
        
        for sqlite_project in sqlite_projects:
            # Buscar proyecto correspondiente en Supabase
            supabase_project = self.supabase.table("projects").select("id").eq("name", sqlite_project["name"]).execute()
            
            if supabase_project.data:
                mapping[sqlite_project["id"]] = supabase_project.data[0]["id"]
        
        return mapping
    
    def backup_sqlite(self) -> bool:
        """Crea backup de la base de datos SQLite"""
        if not self.check_sqlite_exists():
            return True
        
        try:
            backup_name = f"planner_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
            backup_path = os.path.join(os.path.dirname(self.sqlite_db_path), backup_name)
            
            # Copiar archivo
            import shutil
            shutil.copy2(self.sqlite_db_path, backup_path)
            
            print(f"✅ Backup creado: {backup_path}")
            return True
        except Exception as e:
            print(f"❌ Error creando backup: {e}")
            return False
    
    def switch_to_supabase(self) -> bool:
        """Cambia la aplicación para usar Supabase"""
        try:
            # Backup del main.py actual
            if os.path.exists("main.py"):
                backup_name = f"main_sqlite_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.py"
                import shutil
                shutil.copy2("main.py", backup_name)
                print(f"✅ Backup de main.py creado: {backup_name}")
            
            # Copiar main_supabase.py a main.py
            if os.path.exists("main_supabase.py"):
                import shutil
                shutil.copy2("main_supabase.py", "main.py")
                print("✅ Aplicación configurada para usar Supabase")
                return True
            else:
                print("❌ No se encontró main_supabase.py")
                return False
        except Exception as e:
            print(f"❌ Error cambiando a Supabase: {e}")
            return False
    
    def run_migration(self) -> bool:
        """Ejecuta la migración completa"""
        print("🚀 Iniciando migración de SQLite a Supabase...\n")
        
        # Verificar conexión con Supabase
        if not self.check_supabase_connection():
            print("❌ No se pudo conectar con Supabase. Verifica tu configuración.")
            return False
        
        print("✅ Conexión con Supabase verificada\n")
        
        # Crear backup de SQLite
        if self.check_sqlite_exists():
            print("📦 Creando backup de SQLite...")
            if not self.backup_sqlite():
                return False
            print()
        
        # Migrar datos
        steps = [
            ("usuarios", self.migrate_users),
            ("proyectos", self.migrate_projects),
            ("tareas", self.migrate_tasks)
        ]
        
        for step_name, step_function in steps:
            print(f"🔄 Migrando {step_name}...")
            if not step_function():
                print(f"❌ Error en migración de {step_name}")
                return False
            print(f"✅ {step_name.capitalize()} migrados exitosamente\n")
        
        # Cambiar aplicación a Supabase
        print("🔄 Configurando aplicación para usar Supabase...")
        if not self.switch_to_supabase():
            return False
        
        print("\n🎉 ¡Migración completada exitosamente!")
        print("\n📋 Próximos pasos:")
        print("1. Reinicia el servidor backend")
        print("2. Verifica que la aplicación funcione correctamente")
        print("3. Prueba login con las credenciales existentes")
        print("4. Si todo funciona, puedes eliminar el archivo SQLite")
        
        return True

def main():
    """Función principal"""
    print("=" * 60)
    print("🔄 MIGRADOR DE SQLITE A SUPABASE - PROJECT PLANNER")
    print("=" * 60)
    print()
    
    # Verificar variables de entorno
    required_vars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print("❌ Variables de entorno faltantes:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nConfigura estas variables en tu archivo .env")
        return False
    
    # Crear migrador
    migrator = SQLiteToSupabaseMigrator()
    
    # Ejecutar migración
    success = migrator.run_migration()
    
    if success:
        print("\n✅ Migración completada exitosamente")
        return True
    else:
        print("\n❌ La migración falló")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)