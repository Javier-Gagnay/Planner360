// Script específico para la página de login
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si ya está logueado
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const token = localStorage.getItem('access_token');
    
    if (currentUser && token) {
        window.location.href = 'index.html';
        return;
    }

    // AuthManager simplificado para login que usa la API
    window.authManager = {
        login: async function(username, password) {
            return await window.apiClient.login(username, password);
        },
        
        register: async function(userData) {
            return await window.apiClient.register(userData);
        }
    };
    
    // Crear usuario administrador por defecto si no existe
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const adminExists = users.find(user => user.username === 'admin123');
    
    if (!adminExists) {
        const adminUser = {
            id: 'admin_' + Date.now(),
            name: 'Administrador',
            username: 'admin123',
            email: 'admin@planner.com',
            password: 'admin123',
            role: 'admin',
            profilePhoto: '',
            createdAt: new Date().toISOString()
        };
        users.push(adminUser);
        localStorage.setItem('users', JSON.stringify(users));
    }

    // Configurar eventos del formulario de login
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const loginBtn = document.getElementById('loginBtn');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        loginBtn.disabled = true;
        loginBtn.textContent = 'Iniciando sesión...';
        
        try {
            const result = await authManager.login(username, password);
            
            if (result.success) {
                successMessage.textContent = 'Inicio de sesión exitoso. Redirigiendo...';
                successMessage.style.display = 'block';
                errorMessage.style.display = 'none';
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                errorMessage.textContent = result.message;
                errorMessage.style.display = 'block';
                successMessage.style.display = 'none';
                
                loginBtn.disabled = false;
                loginBtn.textContent = 'Iniciar Sesión';
            }
        } catch (error) {
            errorMessage.textContent = 'Error de conexión. Intenta nuevamente.';
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
            
            loginBtn.disabled = false;
            loginBtn.textContent = 'Iniciar Sesión';
        }
    });

    // Configurar modal de registro
    const showRegister = document.getElementById('showRegister');
    const registerModal = document.getElementById('registerModal');
    const closeRegister = document.getElementById('closeRegister');
    const cancelRegister = document.getElementById('cancelRegister');
    const registerForm = document.getElementById('registerForm');

    showRegister.addEventListener('click', function(e) {
        e.preventDefault();
        registerModal.style.display = 'flex';
    });

    closeRegister.addEventListener('click', function() {
        registerModal.style.display = 'none';
    });

    cancelRegister.addEventListener('click', function() {
        registerModal.style.display = 'none';
    });

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('regName').value,
            email: document.getElementById('regEmail').value,
            username: document.getElementById('regUsername').value,
            password: document.getElementById('regPassword').value,
            confirmPassword: document.getElementById('regConfirmPassword').value
        };
        
        try {
            const result = await authManager.register(formData);
            
            if (result.success) {
                registerModal.style.display = 'none';
                successMessage.textContent = 'Registro exitoso. Ya puedes iniciar sesión.';
                successMessage.style.display = 'block';
                errorMessage.style.display = 'none';
                registerForm.reset();
            } else {
                errorMessage.textContent = result.message;
                errorMessage.style.display = 'block';
                successMessage.style.display = 'none';
            }
        } catch (error) {
            errorMessage.textContent = 'Error de conexión. Intenta nuevamente.';
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
        }
    });

    // Cerrar modal al hacer clic fuera
    registerModal.addEventListener('click', function(e) {
        if (e.target === registerModal) {
            registerModal.style.display = 'none';
        }
    });
});