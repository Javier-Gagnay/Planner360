// Configuración de la API
const API_BASE_URL = 'http://localhost:8001/api';

// Clase para manejar las llamadas a la API
class ApiClient {
    constructor() {
        this.token = localStorage.getItem('access_token');
    }

    // Método para hacer peticiones HTTP
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        // Agregar token de autorización si existe
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Métodos de autenticación
    async login(username, password) {
        try {
            const response = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });

            if (response.access_token) {
                this.token = response.access_token;
                localStorage.setItem('access_token', this.token);
                localStorage.setItem('currentUser', JSON.stringify(response.user));
                return { success: true, user: response.user };
            }

            return { success: false, message: 'Error en el login' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async register(userData) {
        try {
            const response = await this.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData),
            });

            return { success: true, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getCurrentUser() {
        try {
            const user = await this.request('/auth/me');
            localStorage.setItem('currentUser', JSON.stringify(user));
            return user;
        } catch (error) {
            this.logout();
            throw error;
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('currentUser');
    }

    // Métodos de proyectos
    async getProjects() {
        try {
            return await this.request('/projects');
        } catch (error) {
            console.error('Error getting projects:', error);
            return [];
        }
    }

    async createProject(projectData) {
        try {
            const response = await this.request('/projects', {
                method: 'POST',
                body: JSON.stringify(projectData),
            });
            return { success: true, id: response.id };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async updateProject(projectId, projectData) {
        try {
            await this.request(`/projects/${projectId}`, {
                method: 'PUT',
                body: JSON.stringify(projectData),
            });
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async deleteProject(projectId) {
        try {
            await this.request(`/projects/${projectId}`, {
                method: 'DELETE',
            });
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Métodos de tareas
    async getTasks(projectId = null) {
        try {
            const endpoint = projectId ? `/tasks?project_id=${projectId}` : '/tasks';
            return await this.request(endpoint);
        } catch (error) {
            console.error('Error getting tasks:', error);
            return [];
        }
    }

    async createTask(taskData) {
        try {
            const response = await this.request('/tasks', {
                method: 'POST',
                body: JSON.stringify(taskData),
            });
            return { success: true, id: response.id };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async updateTask(taskId, taskData) {
        try {
            await this.request(`/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify(taskData),
            });
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async deleteTask(taskId) {
        try {
            await this.request(`/tasks/${taskId}`, {
                method: 'DELETE',
            });
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// Instancia global del cliente API
window.apiClient = new ApiClient();