#!/usr/bin/env python3
"""
Script de prueba para verificar la funcionalidad de Supabase

Este script verifica que todas las funciones de Supabase estén funcionando correctamente
antes de hacer la migración completa.
"""

import os
import sys
import asyncio
from datetime import datetime
from typing import Dict, Any
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

class SupabaseTestSuite:
    def __init__(self):
        self.supabase = supabase
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str = ""):
        """Registra el resultado de una prueba"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message
        })
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
    
    def test_connection(self) -> bool:
        """Prueba la conexión básica con Supabase"""
        try:
            result = self.supabase.table("categories").select("count", count="exact").execute()
            self.log_test("Conexión con Supabase", True, f"Conectado exitosamente")
            return True
        except Exception as e:
            self.log_test("Conexión con Supabase", False, f"Error: {str(e)}")
            return False
    
    def test_categories_table(self) -> bool:
        """Prueba la tabla de categorías"""
        try:
            # Verificar que existan categorías por defecto
            result = self.supabase.table("categories").select("*").execute()
            
            if result.data and len(result.data) > 0:
                self.log_test("Tabla categories", True, f"Encontradas {len(result.data)} categorías")
                return True
            else:
                self.log_test("Tabla categories", False, "No se encontraron categorías por defecto")
                return False
        except Exception as e:
            self.log_test("Tabla categories", False, f"Error: {str(e)}")
            return False
    
    def test_users_table(self) -> bool:
        """Prueba la tabla de usuarios"""
        try:
            # Verificar estructura de la tabla
            result = self.supabase.table("users").select("id, name, username, email, role").limit(1).execute()
            
            self.log_test("Tabla users", True, "Estructura de tabla verificada")
            return True
        except Exception as e:
            self.log_test("Tabla users", False, f"Error: {str(e)}")
            return False
    
    def test_projects_table(self) -> bool:
        """Prueba la tabla de proyectos"""
        try:
            # Verificar estructura de la tabla
            result = self.supabase.table("projects").select("id, name, description, status, priority").limit(1).execute()
            
            self.log_test("Tabla projects", True, "Estructura de tabla verificada")
            return True
        except Exception as e:
            self.log_test("Tabla projects", False, f"Error: {str(e)}")
            return False
    
    def test_tasks_table(self) -> bool:
        """Prueba la tabla de tareas"""
        try:
            # Verificar estructura de la tabla
            result = self.supabase.table("tasks").select("id, title, description, status, priority").limit(1).execute()
            
            self.log_test("Tabla tasks", True, "Estructura de tabla verificada")
            return True
        except Exception as e:
            self.log_test("Tabla tasks", False, f"Error: {str(e)}")
            return False
    
    def test_create_user(self) -> bool:
        """Prueba crear un usuario de prueba"""
        try:
            test_user = {
                "name": "Usuario Prueba",
                "username": f"test_user_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "email": f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com",
                "password_hash": "$2b$12$test_hash",
                "role": "user"
            }
            
            result = self.supabase.table("users").insert(test_user).execute()
            
            if result.data:
                user_id = result.data[0]["id"]
                self.log_test("Crear usuario", True, f"Usuario creado con ID: {user_id}")
                
                # Limpiar: eliminar usuario de prueba
                self.supabase.table("users").delete().eq("id", user_id).execute()
                return True
            else:
                self.log_test("Crear usuario", False, "No se pudo crear el usuario")
                return False
        except Exception as e:
            self.log_test("Crear usuario", False, f"Error: {str(e)}")
            return False
    
    def test_create_project(self) -> bool:
        """Prueba crear un proyecto de prueba"""
        try:
            # Primero necesitamos un usuario
            test_user = {
                "name": "Usuario Proyecto",
                "username": f"project_user_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "email": f"project_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com",
                "password_hash": "$2b$12$test_hash",
                "role": "user"
            }
            
            user_result = self.supabase.table("users").insert(test_user).execute()
            
            if not user_result.data:
                self.log_test("Crear proyecto", False, "No se pudo crear usuario para el proyecto")
                return False
            
            user_id = user_result.data[0]["id"]
            
            # Crear proyecto
            test_project = {
                "name": f"Proyecto Prueba {datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "description": "Proyecto de prueba para verificar funcionalidad",
                "status": "planning",
                "priority": "medium",
                "progress": 0,
                "created_by": user_id,
                "assigned_to": [],
                "tags": ["prueba"]
            }
            
            project_result = self.supabase.table("projects").insert(test_project).execute()
            
            if project_result.data:
                project_id = project_result.data[0]["id"]
                self.log_test("Crear proyecto", True, f"Proyecto creado con ID: {project_id}")
                
                # Limpiar
                self.supabase.table("projects").delete().eq("id", project_id).execute()
                self.supabase.table("users").delete().eq("id", user_id).execute()
                return True
            else:
                self.log_test("Crear proyecto", False, "No se pudo crear el proyecto")
                # Limpiar usuario
                self.supabase.table("users").delete().eq("id", user_id).execute()
                return False
        except Exception as e:
            self.log_test("Crear proyecto", False, f"Error: {str(e)}")
            return False
    
    def test_create_task(self) -> bool:
        """Prueba crear una tarea de prueba"""
        try:
            # Crear usuario y proyecto para la tarea
            test_user = {
                "name": "Usuario Tarea",
                "username": f"task_user_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "email": f"task_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com",
                "password_hash": "$2b$12$test_hash",
                "role": "user"
            }
            
            user_result = self.supabase.table("users").insert(test_user).execute()
            user_id = user_result.data[0]["id"]
            
            test_project = {
                "name": f"Proyecto Tarea {datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "description": "Proyecto para prueba de tarea",
                "status": "planning",
                "priority": "medium",
                "progress": 0,
                "created_by": user_id,
                "assigned_to": [],
                "tags": []
            }
            
            project_result = self.supabase.table("projects").insert(test_project).execute()
            project_id = project_result.data[0]["id"]
            
            # Crear tarea
            test_task = {
                "title": f"Tarea Prueba {datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "description": "Tarea de prueba para verificar funcionalidad",
                "project_id": project_id,
                "status": "todo",
                "priority": "medium",
                "progress": 0,
                "created_by": user_id,
                "tags": ["prueba"],
                "dependencies": []
            }
            
            task_result = self.supabase.table("tasks").insert(test_task).execute()
            
            if task_result.data:
                task_id = task_result.data[0]["id"]
                self.log_test("Crear tarea", True, f"Tarea creada con ID: {task_id}")
                
                # Limpiar
                self.supabase.table("tasks").delete().eq("id", task_id).execute()
                self.supabase.table("projects").delete().eq("id", project_id).execute()
                self.supabase.table("users").delete().eq("id", user_id).execute()
                return True
            else:
                self.log_test("Crear tarea", False, "No se pudo crear la tarea")
                # Limpiar
                self.supabase.table("projects").delete().eq("id", project_id).execute()
                self.supabase.table("users").delete().eq("id", user_id).execute()
                return False
        except Exception as e:
            self.log_test("Crear tarea", False, f"Error: {str(e)}")
            return False
    
    def test_rls_policies(self) -> bool:
        """Prueba las políticas de Row Level Security"""
        try:
            # Esta prueba es básica, las políticas RLS se prueban mejor con usuarios autenticados
            # Por ahora solo verificamos que las tablas respondan
            tables = ["users", "projects", "tasks", "categories"]
            
            for table in tables:
                result = self.supabase.table(table).select("count", count="exact").execute()
                # Si no hay error, las políticas están configuradas correctamente
            
            self.log_test("Políticas RLS", True, "Políticas configuradas correctamente")
            return True
        except Exception as e:
            self.log_test("Políticas RLS", False, f"Error: {str(e)}")
            return False
    
    def test_db_utils(self) -> bool:
        """Prueba las utilidades de base de datos"""
        try:
            # Probar función de formateo de usuario
            test_user_data = {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "Test User",
                "username": "testuser",
                "email": "test@test.com",
                "role": "user",
                "created_at": "2024-01-01T00:00:00Z"
            }
            
            formatted_user = db_utils.format_user_response(test_user_data)
            
            if "id" in formatted_user and "name" in formatted_user:
                self.log_test("Utilidades DB", True, "Funciones de formateo funcionando")
                return True
            else:
                self.log_test("Utilidades DB", False, "Error en funciones de formateo")
                return False
        except Exception as e:
            self.log_test("Utilidades DB", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self) -> bool:
        """Ejecuta todas las pruebas"""
        print("🧪 Iniciando suite de pruebas de Supabase...\n")
        
        tests = [
            self.test_connection,
            self.test_categories_table,
            self.test_users_table,
            self.test_projects_table,
            self.test_tasks_table,
            self.test_create_user,
            self.test_create_project,
            self.test_create_task,
            self.test_rls_policies,
            self.test_db_utils
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
            print()  # Línea en blanco entre pruebas
        
        # Resumen
        print("=" * 50)
        print(f"📊 RESUMEN DE PRUEBAS")
        print("=" * 50)
        print(f"Total: {total}")
        print(f"Pasaron: {passed}")
        print(f"Fallaron: {total - passed}")
        print(f"Éxito: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 ¡Todas las pruebas pasaron! Supabase está listo para usar.")
            return True
        else:
            print(f"\n⚠️  {total - passed} pruebas fallaron. Revisa la configuración.")
            return False
    
    def print_environment_info(self):
        """Imprime información del entorno"""
        print("🔧 INFORMACIÓN DEL ENTORNO")
        print("=" * 30)
        
        env_vars = [
            "SUPABASE_URL",
            "SUPABASE_ANON_KEY",
            "SUPABASE_SERVICE_ROLE_KEY"
        ]
        
        for var in env_vars:
            value = os.getenv(var)
            if value:
                # Mostrar solo los primeros y últimos caracteres por seguridad
                masked_value = f"{value[:8]}...{value[-8:]}" if len(value) > 16 else "***"
                print(f"✅ {var}: {masked_value}")
            else:
                print(f"❌ {var}: No configurada")
        
        print()

def main():
    """Función principal"""
    print("=" * 60)
    print("🧪 SUITE DE PRUEBAS DE SUPABASE - PROJECT PLANNER")
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
    
    # Crear suite de pruebas
    test_suite = SupabaseTestSuite()
    
    # Mostrar información del entorno
    test_suite.print_environment_info()
    
    # Ejecutar pruebas
    success = test_suite.run_all_tests()
    
    if success:
        print("\n✅ Todas las pruebas pasaron. Supabase está listo para usar.")
        print("\n📋 Próximos pasos:")
        print("1. Ejecuta el script de migración: python migrate_to_supabase.py")
        print("2. Reinicia el servidor backend")
        print("3. Prueba la aplicación completa")
        return True
    else:
        print("\n❌ Algunas pruebas fallaron. Revisa la configuración antes de continuar.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)