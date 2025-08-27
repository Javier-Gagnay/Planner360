// Planificador de Proyectos Dinámico - JavaScript Principal

// Estado global de la aplicación
class ProjectManager {
    constructor() {
        this.projects = {};
        this.currentProject = null;
        this.taskIdCounter = 1;
        this.projectIdCounter = 1;
        this.editingTask = null;
        this.editingProject = null;
        this.currentView = 'table'; // 'table' o 'calendar'
        this.currentCalendarDate = new Date();
        this.currentHybridDate = new Date();
        
        this.init();
    }

    setupSettingsModalListeners() {
        // Event listeners para las pestañas del modal de configuración
        const tabButtons = document.querySelectorAll('.settings-tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                showSettingsTab(tabName);
            });
        });

        // Event listeners para los botones de cerrar modal
        const closeButtons = document.querySelectorAll('#settingsModal .modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', closeSettingsModal);
        });

        // Event listeners para los botones de aplicar tema predefinido
        const applyButtons = document.querySelectorAll('.theme-card .btn-primary');
        applyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const themeCard = e.target.closest('.theme-card');
                const themeName = themeCard.querySelector('h4').textContent;
                if (themeName === 'Tema por Defecto') {
                    applyPredefinedTheme('default');
                } else if (themeName === 'Tema Reybesa') {
                    applyPredefinedTheme('reybesa');
                }
            });
        });

        // Configurar la funcionalidad de carga de archivos
        setupThemeUpload();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.createDefaultProject();
        this.renderProjects();
    }

    // Gestión de almacenamiento local
    saveToStorage() {
        try {
            localStorage.setItem('projectManager', JSON.stringify({
                projects: this.projects,
                currentProject: this.currentProject,
                taskIdCounter: this.taskIdCounter,
                projectIdCounter: this.projectIdCounter
            }));
        } catch (error) {
            console.error('Error guardando en localStorage:', error);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('projectManager');
            if (data) {
                const parsed = JSON.parse(data);
                this.projects = parsed.projects || {};
                this.currentProject = parsed.currentProject;
                this.taskIdCounter = parsed.taskIdCounter || 1;
                this.projectIdCounter = parsed.projectIdCounter || 1;
            }
        } catch (error) {
            console.error('Error cargando desde localStorage:', error);
        }
    }

    // Configuración de eventos
    setupEventListeners() {
        // Botones principales
        document.getElementById('projectListBtn').addEventListener('click', () => this.showProjectListModal());
        document.getElementById('addProjectBtn').addEventListener('click', () => this.showProjectModal());
        document.getElementById('editProjectBtn').addEventListener('click', () => this.showProjectModal(this.currentProject));
        document.getElementById('addTaskBtn').addEventListener('click', () => this.showTaskModal());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('settingsBtn').addEventListener('click', () => openSettingsModal());
        document.getElementById('viewModeBtn').addEventListener('click', () => this.toggleView());
        
        // Filtros y búsqueda
        document.getElementById('searchTasks').addEventListener('input', (e) => this.filterTasks());
        document.getElementById('statusFilter').addEventListener('change', () => this.filterTasks());
        document.getElementById('priorityFilter').addEventListener('change', () => this.filterTasks());
        
        // Eventos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
        
        // Clicks fuera de modales
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
        
        // Eventos del calendario
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
        
        // Vista híbrida
        document.getElementById('hybridViewBtn').addEventListener('click', () => this.toggleHybridView());
        document.getElementById('hybridPrevMonth').addEventListener('click', () => this.changeHybridMonth(-1));
        document.getElementById('hybridNextMonth').addEventListener('click', () => this.changeHybridMonth(1));
        
        // Lista de proyectos
        document.getElementById('newProjectFromListBtn').addEventListener('click', () => {
            this.closeModal('projectListModal');
            this.showProjectModal();
        });
        
        // Event listeners para el modal de configuración
        this.setupSettingsModalListeners();
    }

    // Gestión de proyectos
    createDefaultProject() {
        if (Object.keys(this.projects).length === 0) {
            const defaultProject = {
                id: 'proyecto1',
                name: 'Proyecto 1',
                description: 'Proyecto de ejemplo',
                startDate: this.formatDate(new Date()),
                endDate: null,
                tasks: {},
                createdAt: new Date().toISOString()
            };
            
            this.projects['proyecto1'] = defaultProject;
            this.currentProject = 'proyecto1';
            this.saveToStorage();
        } else if (!this.currentProject || !this.projects[this.currentProject]) {
            this.currentProject = Object.keys(this.projects)[0];
        }
    }

    showProjectModal(projectId = null) {
        this.editingProject = projectId;
        const modal = document.getElementById('projectModal');
        const title = document.getElementById('projectModalTitle');
        
        if (projectId) {
            title.textContent = 'Editar Proyecto';
            const project = this.projects[projectId];
            document.getElementById('projectName').value = project.name;
            document.getElementById('projectDescription').value = project.description || '';
            document.getElementById('projectStartDate').value = project.startDate;
            document.getElementById('projectEndDate').value = project.endDate || '';
        } else {
            title.textContent = 'Nuevo Proyecto';
            document.getElementById('projectForm').reset();
            document.getElementById('projectStartDate').value = this.formatDate(new Date());
        }
        
        this.showModal(modal);
    }

    saveProject() {
        const name = document.getElementById('projectName').value.trim();
        const description = document.getElementById('projectDescription').value.trim();
        const startDate = document.getElementById('projectStartDate').value;
        const endDate = document.getElementById('projectEndDate').value;
        
        if (!name || !startDate) {
            alert('Por favor, completa los campos obligatorios.');
            return;
        }
        
        if (this.editingProject) {
            // Editar proyecto existente
            const project = this.projects[this.editingProject];
            project.name = name;
            project.description = description;
            project.startDate = startDate;
            project.endDate = endDate;
        } else {
            // Crear nuevo proyecto
            const projectId = `proyecto${this.projectIdCounter++}`;
            this.projects[projectId] = {
                id: projectId,
                name,
                description,
                startDate,
                endDate,
                tasks: {},
                createdAt: new Date().toISOString()
            };
            this.currentProject = projectId;
        }
        
        this.saveToStorage();
        this.renderProjects();
        this.closeModal('projectModal');
    }

    closeProject(projectId) {
        if (Object.keys(this.projects).length <= 1) {
            alert('Debe mantener al menos un proyecto abierto.');
            return;
        }
        
        if (confirm('¿Estás seguro de que quieres cerrar este proyecto?')) {
            delete this.projects[projectId];
            
            if (this.currentProject === projectId) {
                this.currentProject = Object.keys(this.projects)[0];
            }
            
            this.saveToStorage();
            this.renderProjects();
        }
    }

    switchProject(projectId) {
        this.currentProject = projectId;
        this.saveToStorage();
        this.renderProjects();
    }

    // Modal Lista de Proyectos
    showProjectListModal() {
        this.renderProjectList();
        const modal = document.getElementById('projectListModal');
        this.showModal(modal);
    }

    renderProjectList() {
        const grid = document.getElementById('projectListGrid');
        const totalProjectsSpan = document.getElementById('totalProjects');
        const totalTasksSpan = document.getElementById('totalAllTasks');
        
        const projectCount = Object.keys(this.projects).length;
        let totalTasks = 0;
        
        // Calcular total de tareas
        Object.values(this.projects).forEach(project => {
            totalTasks += Object.keys(project.tasks).length;
        });
        
        totalProjectsSpan.textContent = projectCount;
        totalTasksSpan.textContent = totalTasks;
        
        if (projectCount === 0) {
            grid.innerHTML = `
                <div class="empty-projects">
                    <i class="fas fa-project-diagram"></i>
                    <h3>No hay proyectos</h3>
                    <p>Crea tu primer proyecto para comenzar</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = '';
        
        Object.entries(this.projects).forEach(([projectId, project]) => {
            const card = this.createProjectCard(projectId, project);
            grid.appendChild(card);
        });
    }

    createProjectCard(projectId, project) {
        const card = document.createElement('div');
        card.className = `project-card ${projectId === this.currentProject ? 'active' : ''}`;
        
        const tasks = Object.values(project.tasks);
        const taskCount = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        const progress = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;
        
        // Calcular duración total del proyecto
        let totalDuration = 0;
        tasks.forEach(task => {
            if (task.durationPlanned) {
                totalDuration += parseInt(task.durationPlanned);
            }
        });
        
        card.innerHTML = `
            ${projectId === this.currentProject ? '<div class="project-card-badge">Activo</div>' : ''}
            <div class="project-card-header">
                <div>
                    <div class="project-card-title">${project.name}</div>
                    <div class="project-card-description">${project.description || 'Sin descripción'}</div>
                </div>
            </div>
            
            <div class="project-card-stats">
                <div class="project-card-stat">
                    <i class="fas fa-tasks"></i>
                    <span>${taskCount} tareas</span>
                </div>
                <div class="project-card-stat">
                    <i class="fas fa-calendar-day"></i>
                    <span>${totalDuration} días</span>
                </div>
                <div class="project-card-stat">
                    <i class="fas fa-check-circle"></i>
                    <span>${completedTasks} completadas</span>
                </div>
                <div class="project-card-stat">
                    <i class="fas fa-clock"></i>
                    <span>${taskCount - completedTasks} pendientes</span>
                </div>
            </div>
            
            <div class="project-card-progress">
                <div class="project-card-progress-label">
                    <span>Progreso</span>
                    <span>${progress}%</span>
                </div>
                <div class="project-card-progress-bar">
                    <div class="project-card-progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
            
            <div class="project-card-dates">
                <span><i class="fas fa-play"></i> ${this.formatDateDisplay(project.startDate)}</span>
                <span><i class="fas fa-flag"></i> ${this.formatDateDisplay(project.endDate)}</span>
            </div>
            
            <div class="project-card-actions">
                <button class="btn btn-outline" onclick="projectManager.editProjectFromList('${projectId}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-primary" onclick="projectManager.selectProjectFromList('${projectId}')">
                    <i class="fas fa-eye"></i> ${projectId === this.currentProject ? 'Activo' : 'Abrir'}
                </button>
                ${projectId !== this.currentProject ? `
                    <button class="btn btn-danger" onclick="projectManager.deleteProjectFromList('${projectId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        `;
        
        return card;
    }

    selectProjectFromList(projectId) {
        if (projectId !== this.currentProject) {
            this.switchProject(projectId);
        }
        this.closeModal('projectListModal');
    }

    editProjectFromList(projectId) {
        this.closeModal('projectListModal');
        this.showProjectModal(projectId);
    }

    deleteProjectFromList(projectId) {
        if (confirm(`¿Estás seguro de que quieres eliminar el proyecto "${this.projects[projectId].name}"? Esta acción no se puede deshacer.`)) {
            delete this.projects[projectId];
            
            // Si era el proyecto actual, cambiar a otro
            if (projectId === this.currentProject) {
                const remainingProjects = Object.keys(this.projects);
                if (remainingProjects.length > 0) {
                    this.currentProject = remainingProjects[0];
                } else {
                    this.currentProject = null;
                    this.createDefaultProject();
                }
            }
            
            this.saveToStorage();
            this.renderProjects();
            this.renderProjectList();
        }
    }

    // Gestión de tareas
    showTaskModal(taskId = null, parentId = null) {
        this.editingTask = taskId;
        const modal = document.getElementById('taskModal');
        const title = document.getElementById('taskModalTitle');
        
        // Actualizar opciones de tareas padre
        this.updateParentTaskOptions(taskId);
        
        if (taskId) {
            title.textContent = 'Editar Actividad';
            const task = this.getCurrentProject().tasks[taskId];
            document.getElementById('taskName').value = task.name;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('taskStartPlanned').value = task.startPlanned;
            document.getElementById('taskDurationPlanned').value = task.durationPlanned;
            document.getElementById('taskStartActual').value = task.startActual || '';
            document.getElementById('taskDurationActual').value = task.durationActual || '';
            document.getElementById('taskProgress').value = task.progress;
            document.getElementById('parentTask').value = task.parentId || '';
            updateProgressValue(task.progress);
        } else {
            title.textContent = 'Nueva Actividad';
            document.getElementById('taskForm').reset();
            document.getElementById('taskStartPlanned').value = this.formatDate(new Date());
            document.getElementById('taskDurationPlanned').value = 1;
            document.getElementById('taskProgress').value = 0;
            document.getElementById('parentTask').value = parentId || '';
            updateProgressValue(0);
        }
        
        this.showModal(modal);
    }

    updateParentTaskOptions(excludeTaskId = null) {
        const select = document.getElementById('parentTask');
        const currentProject = this.getCurrentProject();
        
        // Limpiar opciones
        select.innerHTML = '<option value="">-- Ninguna (Actividad principal) --</option>';
        
        // Agregar tareas principales como opciones
        Object.values(currentProject.tasks).forEach(task => {
            if (task.id !== excludeTaskId && !task.parentId) {
                const option = document.createElement('option');
                option.value = task.id;
                option.textContent = task.name;
                select.appendChild(option);
            }
        });
    }

    saveTask() {
        const name = document.getElementById('taskName').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const status = document.getElementById('taskStatus').value;
        const startPlanned = document.getElementById('taskStartPlanned').value;
        const durationPlanned = parseInt(document.getElementById('taskDurationPlanned').value);
        const startActual = document.getElementById('taskStartActual').value;
        const durationActual = parseInt(document.getElementById('taskDurationActual').value) || 0;
        const progress = parseInt(document.getElementById('taskProgress').value);
        const parentId = document.getElementById('parentTask').value || null;
        
        if (!name || !startPlanned || !durationPlanned) {
            alert('Por favor, completa los campos obligatorios.');
            return;
        }
        
        const currentProject = this.getCurrentProject();
        
        if (this.editingTask) {
            // Editar tarea existente
            const task = currentProject.tasks[this.editingTask];
            task.name = name;
            task.description = description;
            task.priority = priority;
            task.status = status;
            task.startPlanned = startPlanned;
            task.durationPlanned = durationPlanned;
            task.startActual = startActual;
            task.durationActual = durationActual;
            task.progress = progress;
            task.parentId = parentId;
            task.updatedAt = new Date().toISOString();
        } else {
            // Crear nueva tarea
            const taskId = `task${this.taskIdCounter++}`;
            currentProject.tasks[taskId] = {
                id: taskId,
                name,
                description,
                priority,
                status,
                startPlanned,
                durationPlanned,
                startActual,
                durationActual,
                progress,
                parentId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }
        
        // Actualizar progreso dinámico de tareas padre
        this.updateParentTasksProgress();
        
        this.saveToStorage();
        this.renderCurrentProject();
        this.closeModal('taskModal');
    }

    deleteTask(taskId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
            const currentProject = this.getCurrentProject();
            
            // Eliminar subtareas primero
            Object.values(currentProject.tasks).forEach(task => {
                if (task.parentId === taskId) {
                    delete currentProject.tasks[task.id];
                }
            });
            
            // Eliminar la tarea principal
            delete currentProject.tasks[taskId];
            
            this.saveToStorage();
            this.renderCurrentProject();
        }
    }

    toggleTaskExpansion(taskId) {
        const row = document.querySelector(`[data-task-id="${taskId}"]`);
        const expandBtn = row.querySelector('.expand-btn');
        const subtaskRows = document.querySelectorAll(`[data-parent-id="${taskId}"]`);
        
        const isExpanded = expandBtn.classList.contains('expanded');
        
        if (isExpanded) {
            expandBtn.classList.remove('expanded');
            subtaskRows.forEach(row => row.style.display = 'none');
        } else {
            expandBtn.classList.add('expanded');
            subtaskRows.forEach(row => row.style.display = 'table-row');
        }
    }

    // Renderizado
    renderProjects() {
        this.renderTabs();
        this.renderCurrentProject();
    }

    renderTabs() {
        const tabsNav = document.getElementById('tabsNav');
        tabsNav.innerHTML = '';
        
        Object.values(this.projects).forEach(project => {
            const tab = document.createElement('div');
            tab.className = `tab ${project.id === this.currentProject ? 'active' : ''}`;
            tab.setAttribute('data-project', project.id);
            
            tab.innerHTML = `
                <span>${project.name}</span>
                <button class="tab-close" onclick="projectManager.closeProject('${project.id}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            tab.addEventListener('click', (e) => {
                if (!e.target.closest('.tab-close')) {
                    this.switchProject(project.id);
                }
            });
            
            tabsNav.appendChild(tab);
        });
    }

    renderCurrentProject() {
        const currentProject = this.getCurrentProject();
        if (!currentProject) return;
        
        // Actualizar información del proyecto
        document.getElementById('projectTitle').textContent = currentProject.name;
        
        // Calcular estadísticas
        const tasks = Object.values(currentProject.tasks);
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        const avgProgress = totalTasks > 0 ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / totalTasks) : 0;
        
        // Calcular duración del proyecto
        let projectDuration = 0;
        if (tasks.length > 0) {
            const startDates = tasks.map(task => new Date(task.startPlanned)).filter(date => !isNaN(date));
            const endDates = tasks.map(task => {
                const start = new Date(task.startPlanned);
                start.setDate(start.getDate() + task.durationPlanned);
                return start;
            }).filter(date => !isNaN(date));
            
            if (startDates.length > 0 && endDates.length > 0) {
                const minStart = new Date(Math.min(...startDates));
                const maxEnd = new Date(Math.max(...endDates));
                projectDuration = Math.ceil((maxEnd - minStart) / (1000 * 60 * 60 * 24));
            }
        }
        
        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('projectProgress').textContent = `${avgProgress}%`;
        document.getElementById('projectDuration').textContent = `${projectDuration} días`;
        
        // Renderizar tabla de tareas
        this.renderTasksTable();
        
        // Validar y corregir discrepancias en barras de progreso
        setTimeout(() => {
            this.validateAndFixProgressBars();
        }, 100);
    }

    renderTasksTable() {
        const tbody = document.getElementById('tasksTableBody');
        const currentProject = this.getCurrentProject();
        
        if (!currentProject) {
            tbody.innerHTML = '<tr><td colspan="11" class="text-center">No hay proyecto seleccionado</td></tr>';
            return;
        }
        
        const tasks = Object.values(currentProject.tasks);
        
        if (tasks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="text-center">No hay actividades. <a href="#" onclick="projectManager.showTaskModal()">Crear la primera actividad</a></td></tr>';
            return;
        }
        
        // Separar tareas principales y subtareas
        const mainTasks = tasks.filter(task => !task.parentId);
        const subtasks = tasks.filter(task => task.parentId);
        
        tbody.innerHTML = '';
        
        // Renderizar tareas principales y sus subtareas
        mainTasks.forEach(task => {
            tbody.appendChild(this.createTaskRow(task, false));
            
            // Renderizar subtareas
            const taskSubtasks = subtasks.filter(subtask => subtask.parentId === task.id);
            taskSubtasks.forEach(subtask => {
                tbody.appendChild(this.createTaskRow(subtask, true));
            });
        });
        
        this.applyFilters();
    }

    createTaskRow(task, isSubtask = false) {
        const row = document.createElement('tr');
        row.className = `task-row ${isSubtask ? 'subtask' : ''}`;
        row.setAttribute('data-task-id', task.id);
        if (isSubtask) {
            row.setAttribute('data-parent-id', task.parentId);
            row.style.display = 'none'; // Ocultar subtareas por defecto
        }
        
        const currentProject = this.getCurrentProject();
        const hasSubtasks = !isSubtask && Object.values(currentProject.tasks).some(t => t.parentId === task.id);
        
        // Calcular fechas de fin
        const endPlanned = this.addDays(task.startPlanned, task.durationPlanned);
        const endActual = task.startActual ? this.addDays(task.startActual, task.durationActual || task.durationPlanned) : null;
        
        // Determinar si está fuera del plan
        const isOffPlan = task.startActual && (
            new Date(task.startActual) > new Date(task.startPlanned) || 
            (task.durationActual && task.durationActual > task.durationPlanned)
        );
        
        row.innerHTML = `
            <td class="col-expand">
                ${hasSubtasks ? `<button class="expand-btn" onclick="projectManager.toggleTaskExpansion('${task.id}')"><i class="fas fa-chevron-right"></i></button>` : ''}
            </td>
            <td class="col-activity">
                <div class="task-name ${isOffPlan ? 'off-plan' : ''}">${task.name}</div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                ${isOffPlan ? '<div class="off-plan-indicator"><i class="fas fa-exclamation-triangle"></i> Fuera del plan</div>' : ''}
            </td>
            <td class="col-priority">
                <span class="priority-badge priority-${task.priority}">${this.getPriorityText(task.priority)}</span>
            </td>
            <td class="col-start-planned">
                <div class="date-info">
                    <div class="date-value">${this.formatDateDisplay(task.startPlanned)}</div>
                    <div class="date-label">Inicio Plan</div>
                </div>
            </td>
            <td class="col-duration-planned text-center">
                <div class="duration-info ${task.inheritedDurationPlanned ? 'inherited-duration' : ''}">
                    <div class="duration-value">${task.inheritedDurationPlanned || task.durationPlanned}${task.inheritedDurationPlanned ? ' 📊' : ''}</div>
                    <div class="duration-label">días${task.inheritedDurationPlanned ? ' (Suma)' : ''}</div>
                </div>
            </td>
            <td class="col-start-actual">
                <div class="date-info ${task.startActual ? (new Date(task.startActual) > new Date(task.startPlanned) ? 'delayed' : 'on-time') : ''}">
                    <div class="date-value">${task.startActual ? this.formatDateDisplay(task.startActual) : '-'}</div>
                    <div class="date-label">Inicio Real</div>
                </div>
            </td>
            <td class="col-duration-actual text-center">
                <div class="duration-info ${task.durationActual && task.durationActual > task.durationPlanned ? 'over-duration' : ''} ${task.inheritedDurationActual ? 'inherited-duration' : ''}">
                    <div class="duration-value">${task.inheritedDurationActual || task.durationActual || '-'}${task.inheritedDurationActual ? ' 📊' : ''}</div>
                    <div class="duration-label">${(task.inheritedDurationActual || task.durationActual) ? 'días' : ''}${task.inheritedDurationActual ? ' (Suma)' : ''}</div>
                </div>
            </td>
            <td class="col-progress">
                <div class="progress-container ${task.isDynamicProgress ? 'dynamic-progress' : ''}">
                    ${task.isDynamicProgress ? '<div class="progress-content">' : ''}
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${task.progress}%"></div>
                        </div>
                        <span class="progress-text">${task.progress}%${task.isDynamicProgress ? ' 🔄' : ''}</span>
                    ${task.isDynamicProgress ? '</div>' : ''}
                    ${task.isDynamicProgress ? '<div class="progress-label">Dinámico</div>' : ''}
                </div>
            </td>
            <td class="col-status">
                <span class="status-badge status-${task.status}">${this.getStatusText(task.status)}</span>
            </td>
            <td class="col-timeline">
                ${this.createTimelineBar(task)}
            </td>
            <td class="col-actions">
                <div class="actions-container">
                    ${!isSubtask ? `<button class="action-btn" onclick="projectManager.showTaskModal(null, '${task.id}')" title="Agregar subtarea"><i class="fas fa-plus"></i></button>` : ''}
                    <button class="action-btn edit" onclick="projectManager.showTaskModal('${task.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="projectManager.deleteTask('${task.id}')" title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        
        return row;
    }

    createTimelineBar(task) {
        const currentProject = this.getCurrentProject();
        const allTasks = Object.values(currentProject.tasks);
        
        // Encontrar el rango de fechas del proyecto
        let minDate = new Date(currentProject.startDate);
        let maxDate = new Date(currentProject.startDate);
        
        allTasks.forEach(t => {
            const startDate = new Date(t.startPlanned);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + t.durationPlanned);
            
            if (startDate < minDate) minDate = startDate;
            if (endDate > maxDate) maxDate = endDate;
            
            if (t.startActual) {
                const actualStart = new Date(t.startActual);
                const actualEnd = new Date(actualStart);
                actualEnd.setDate(actualEnd.getDate() + (t.durationActual || t.durationPlanned));
                
                if (actualStart < minDate) minDate = actualStart;
                if (actualEnd > maxDate) maxDate = actualEnd;
            }
        });
        
        const totalProjectDays = Math.max(30, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));
        
        // Calcular posición de la tarea planificada
        const taskStart = new Date(task.startPlanned);
        const daysSinceStart = Math.floor((taskStart - minDate) / (1000 * 60 * 60 * 24));
        const leftPercent = Math.max(0, (daysSinceStart / totalProjectDays) * 100);
        const widthPercent = Math.min(95 - leftPercent, (task.durationPlanned / totalProjectDays) * 100);
        
        let timelineHTML = `
            <div class="timeline-container">
                <!-- Barra planificada (rayada) -->
                <div class="timeline-bar timeline-planned" 
                     style="left: ${leftPercent}%; width: ${widthPercent}%;"
                     title="Planificado: ${this.formatDateDisplay(task.startPlanned)} - ${task.durationPlanned} días">
                </div>
        `;
        
        // Agregar barra real si existe
        if (task.startActual) {
            const actualStart = new Date(task.startActual);
            const actualDays = Math.floor((actualStart - minDate) / (1000 * 60 * 60 * 24));
            const actualDuration = task.durationActual || task.durationPlanned;
            const actualLeftPercent = Math.max(0, (actualDays / totalProjectDays) * 100);
            const actualWidthPercent = Math.min(95 - actualLeftPercent, (actualDuration / totalProjectDays) * 100);
            
            // Barra de duración real (fondo)
            timelineHTML += `
                <div class="timeline-bar timeline-actual" 
                     style="left: ${actualLeftPercent}%; width: ${actualWidthPercent}%;"
                     title="Real: ${this.formatDateDisplay(task.startActual)} - ${actualDuration} días">
                </div>
            `;
            
            // Barra de progreso completado
            const completedWidthPercent = (actualWidthPercent * task.progress) / 100;
            timelineHTML += `
                <div class="timeline-bar timeline-completed" 
                     style="left: ${actualLeftPercent}%; width: ${completedWidthPercent}%;"
                     title="Completado: ${task.progress}%">
                </div>
            `;
            
            // Indicador de progreso fuera del plan si es necesario
            if (task.progress > 0 && (actualLeftPercent !== leftPercent || actualWidthPercent !== widthPercent)) {
                const overrunWidthPercent = Math.max(0, (actualWidthPercent * task.progress) / 100 - widthPercent);
                if (overrunWidthPercent > 0) {
                    timelineHTML += `
                        <div class="timeline-bar timeline-overrun" 
                             style="left: ${leftPercent + widthPercent}%; width: ${overrunWidthPercent}%;"
                             title="Fuera del plan: ${task.progress}%">
                        </div>
                    `;
                }
            }
        } else {
            // Si no hay fecha real, mostrar progreso sobre la planificada
            const completedWidthPercent = (widthPercent * task.progress) / 100;
            if (task.progress > 0) {
                timelineHTML += `
                    <div class="timeline-bar timeline-completed" 
                         style="left: ${leftPercent}%; width: ${completedWidthPercent}%;"
                         title="Completado: ${task.progress}%">
                    </div>
                `;
            }
        }
        
        timelineHTML += '</div>';
        return timelineHTML;
    }

    // Filtros
    filterTasks() {
        this.applyFilters();
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchTasks').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;
        
        const rows = document.querySelectorAll('.task-row');
        
        rows.forEach(row => {
            const taskId = row.getAttribute('data-task-id');
            const task = this.getCurrentProject().tasks[taskId];
            
            if (!task) return;
            
            let show = true;
            
            // Filtro de búsqueda
            if (searchTerm && !task.name.toLowerCase().includes(searchTerm) && 
                !(task.description && task.description.toLowerCase().includes(searchTerm))) {
                show = false;
            }
            
            // Filtro de estado
            if (statusFilter !== 'all' && task.status !== statusFilter) {
                show = false;
            }
            
            // Filtro de prioridad
            if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
                show = false;
            }
            
            row.style.display = show ? 'table-row' : 'none';
        });
    }

    // Utilidades
    getCurrentProject() {
        return this.projects[this.currentProject] || null;
    }

    formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toISOString().split('T')[0];
    }

    formatDateDisplay(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    addDays(dateString, days) {
        const date = new Date(dateString);
        date.setDate(date.getDate() + days);
        return date;
    }

    getPriorityText(priority) {
        const priorities = {
            'low': 'Baja',
            'medium': 'Media',
            'high': 'Alta'
        };
        return priorities[priority] || priority;
    }

    getStatusText(status) {
        const statuses = {
            'pending': 'Pendiente',
            'in-progress': 'En progreso',
            'completed': 'Completado'
        };
        return statuses[status] || status;
    }

    // Modales
    showModal(modal) {
        // Calcular z-index basado en modales abiertos
        const openModals = document.querySelectorAll('.modal.show');
        const baseZIndex = 1000;
        const newZIndex = baseZIndex + openModals.length;
        
        modal.style.zIndex = newZIndex;
        modal.classList.add('show');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
        modal.style.zIndex = '';
        this.editingTask = null;
        this.editingProject = null;
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
            modal.style.zIndex = '';
        });
        this.editingTask = null;
        this.editingProject = null;
    }

    // Exportación
    exportData() {
        const data = {
            projects: this.projects,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `planificador-proyectos-${this.formatDate(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    // Funciones de vista de calendario
    toggleView() {
        const tableView = document.querySelector('.table-container');
        const calendarView = document.getElementById('calendarView');
        const hybridView = document.getElementById('hybridView');
        const viewBtn = document.getElementById('viewModeBtn');
        const hybridBtn = document.getElementById('hybridViewBtn');
        
        if (this.currentView === 'table') {
            this.currentView = 'calendar';
            tableView.style.display = 'none';
            calendarView.style.display = 'block';
            hybridView.style.display = 'none';
            viewBtn.innerHTML = '<i class="fas fa-table"></i> Vista Tabla';
            hybridBtn.classList.remove('btn-primary');
            hybridBtn.classList.add('btn-secondary');
            this.renderCalendar();
        } else if (this.currentView === 'calendar') {
            this.currentView = 'table';
            tableView.style.display = 'block';
            calendarView.style.display = 'none';
            hybridView.style.display = 'none';
            viewBtn.innerHTML = '<i class="fas fa-calendar-alt"></i> Vista Calendario';
            hybridBtn.classList.remove('btn-primary');
            hybridBtn.classList.add('btn-secondary');
        } else {
            // Si está en vista híbrida, cambiar a tabla
            this.currentView = 'table';
            tableView.style.display = 'block';
            calendarView.style.display = 'none';
            hybridView.style.display = 'none';
            viewBtn.innerHTML = '<i class="fas fa-calendar-alt"></i> Vista Calendario';
            hybridBtn.classList.remove('btn-primary');
            hybridBtn.classList.add('btn-secondary');
        }
    }

    changeMonth(direction) {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + direction);
        this.renderCalendar();
    }

    renderCalendar() {
        const currentProject = this.getCurrentProject();
        if (!currentProject) return;

        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        
        // Actualizar título del mes
        document.getElementById('currentMonth').textContent = 
            `${monthNames[this.currentCalendarDate.getMonth()]} ${this.currentCalendarDate.getFullYear()}`;
        
        // Crear grid del calendario
        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';
        
        // Agregar encabezados de días
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-header-day';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });
        
        // Calcular primer día del mes y días en el mes
        const firstDay = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth(), 1);
        const lastDay = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        // Generar 42 días (6 semanas)
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            // Marcar días de otros meses
            if (currentDate.getMonth() !== this.currentCalendarDate.getMonth()) {
                dayElement.classList.add('other-month');
            }
            
            // Marcar día actual
            const today = new Date();
            if (currentDate.toDateString() === today.toDateString()) {
                dayElement.classList.add('today');
            }
            
            // Número del día
            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = currentDate.getDate();
            dayElement.appendChild(dayNumber);
            
            // Agregar tareas del día
            const dateString = this.formatDate(currentDate);
            const tasks = Object.values(currentProject.tasks).filter(task => {
                const taskStart = new Date(task.startPlanned);
                const taskEnd = new Date(task.startPlanned);
                taskEnd.setDate(taskEnd.getDate() + task.durationPlanned - 1);
                
                return currentDate >= taskStart && currentDate <= taskEnd;
            });
            
            tasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = `calendar-task ${task.priority}`;
                if (task.status === 'completed') {
                    taskElement.classList.add('completed');
                }
                taskElement.textContent = task.name;
                taskElement.title = `${task.name} - ${task.status}`;
                taskElement.addEventListener('click', () => this.showTaskModal(task.id));
                dayElement.appendChild(taskElement);
            });
            
            calendarGrid.appendChild(dayElement);
        }
    }

    // Funciones para vista híbrida
    toggleHybridView() {
        const tableView = document.querySelector('.table-container');
        const calendarView = document.getElementById('calendarView');
        const hybridView = document.getElementById('hybridView');
        const viewBtn = document.getElementById('viewModeBtn');
        const hybridBtn = document.getElementById('hybridViewBtn');
        
        if (this.currentView === 'hybrid') {
            // Cambiar a vista tabla
            this.currentView = 'table';
            tableView.style.display = 'block';
            calendarView.style.display = 'none';
            hybridView.style.display = 'none';
            viewBtn.innerHTML = '<i class="fas fa-calendar-alt"></i> Vista Calendario';
            hybridBtn.classList.remove('btn-primary');
            hybridBtn.classList.add('btn-secondary');
        } else {
            // Cambiar a vista híbrida
            this.currentView = 'hybrid';
            tableView.style.display = 'none';
            calendarView.style.display = 'none';
            hybridView.style.display = 'block';
            viewBtn.innerHTML = '<i class="fas fa-calendar-alt"></i> Vista Calendario';
            hybridBtn.classList.remove('btn-secondary');
            hybridBtn.classList.add('btn-primary');
            this.renderHybridView();
        }
    }
    
    changeHybridMonth(direction) {
        this.currentHybridDate.setMonth(this.currentHybridDate.getMonth() + direction);
        this.renderHybridView();
    }
    
    renderHybridView() {
        const currentMonth = this.currentHybridDate.getMonth();
        const currentYear = this.currentHybridDate.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Update month display
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        document.getElementById('hybridCurrentMonth').textContent = 
            `${monthNames[currentMonth]} ${currentYear}`;
        
        // Get table elements
        const fixedBody = document.getElementById('hybridFixedBody');
        const daysHeader = document.getElementById('hybridDaysHeader');
        const daysBody = document.getElementById('hybridDaysBody');
        
        // Clear existing content
        fixedBody.innerHTML = '';
        daysHeader.innerHTML = '';
        daysBody.innerHTML = '';
        
        // Create days header
        for (let day = 1; day <= daysInMonth; day++) {
            const dayHeader = document.createElement('th');
            dayHeader.textContent = day;
            dayHeader.className = 'day-cell';
            
            // Check if it's weekend
            const date = new Date(currentYear, currentMonth, day);
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                dayHeader.classList.add('weekend');
            }
            
            // Check if it's today
            const today = new Date();
            if (date.toDateString() === today.toDateString()) {
                dayHeader.classList.add('today');
            }
            
            daysHeader.appendChild(dayHeader);
        }
        
        // Add tasks and subtasks from current project
        const currentProject = this.getCurrentProject();
        
        if (!currentProject) {
            const noDataRow = document.createElement('tr');
            noDataRow.innerHTML = '<td colspan="7" class="text-center">No hay proyecto seleccionado</td>';
            fixedBody.appendChild(noDataRow);
            
            const noDaysRow = document.createElement('tr');
            noDaysRow.innerHTML = `<td colspan="${daysInMonth}" class="text-center">-</td>`;
            daysBody.appendChild(noDaysRow);
            return;
        }
        
        const tasks = Object.values(currentProject.tasks);
        
        if (tasks.length === 0) {
            const noDataRow = document.createElement('tr');
            noDataRow.innerHTML = '<td colspan="7" class="text-center">No hay actividades</td>';
            fixedBody.appendChild(noDataRow);
            
            const noDaysRow = document.createElement('tr');
            noDaysRow.innerHTML = `<td colspan="${daysInMonth}" class="text-center">-</td>`;
            daysBody.appendChild(noDaysRow);
            return;
        }
        
        // Actualizar progreso dinámico de tareas padre antes de renderizar
        this.updateParentTasksProgress();
        
        // Separar tareas principales y subtareas
        const mainTasks = tasks.filter(task => !task.parentId);
        const subtasks = tasks.filter(task => task.parentId);
        
        // Renderizar tareas principales y sus subtareas
        mainTasks.forEach(task => {
            this.addHybridTaskRow(fixedBody, daysBody, task, currentYear, currentMonth, daysInMonth, 0);
            
            // Renderizar subtareas solo si la tarea padre no está colapsada
            if (!task.collapsed) {
                const taskSubtasks = subtasks.filter(subtask => subtask.parentId === task.id);
                taskSubtasks.forEach(subtask => {
                    this.addHybridTaskRow(fixedBody, daysBody, subtask, currentYear, currentMonth, daysInMonth, 1);
                });
            }
        });
        
        // Sync scroll between fixed and scrollable tables
        this.syncHybridScroll();
    }
    
    isTaskOnDate(task, date) {
        // Check planned dates
        if (task.startPlanned) {
            const plannedStart = new Date(task.startPlanned);
            const plannedEnd = new Date(plannedStart);
            plannedEnd.setDate(plannedEnd.getDate() + task.durationPlanned - 1);
            
            if (date >= plannedStart && date <= plannedEnd) {
                return true;
            }
        }
        
        // Check actual dates
        if (task.startActual) {
            const actualStart = new Date(task.startActual);
            const actualEnd = new Date(actualStart);
            actualEnd.setDate(actualEnd.getDate() + (task.durationActual || task.durationPlanned) - 1);
            
            if (date >= actualStart && date <= actualEnd) {
                return true;
            }
        }
        
        return false;
    }
    
    addHybridTaskRow(fixedBody, daysBody, task, year, month, daysInMonth, level) {
         // Create fixed columns row
         const fixedRow = document.createElement('tr');
         fixedRow.className = `task-row ${level > 0 ? 'subtask' : ''}`;
         fixedRow.setAttribute('data-task-id', task.id);
         if (level > 0) {
             fixedRow.setAttribute('data-parent-id', task.parentId);
         }
         
         // Determinar si está fuera del plan
         const isOffPlan = task.startActual && (
             new Date(task.startActual) > new Date(task.startPlanned) || 
             (task.durationActual && task.durationActual > task.durationPlanned)
         );
         
         // 1. Actividad
         const taskCell = document.createElement('td');
         taskCell.className = 'col-activity';
         
         const taskNameDiv = document.createElement('div');
         taskNameDiv.className = `task-name ${isOffPlan ? 'off-plan' : ''}`;
         taskNameDiv.textContent = task.name;
         if (level > 0) {
             taskNameDiv.style.paddingLeft = `${level * 20}px`;
             taskNameDiv.style.borderLeft = '3px solid #ddd';
             taskNameDiv.style.marginLeft = '10px';
         }
         taskCell.appendChild(taskNameDiv);
         
         if (task.description) {
             const descDiv = document.createElement('div');
             descDiv.className = 'task-description';
             descDiv.textContent = task.description;
             if (level > 0) {
                 descDiv.style.paddingLeft = `${level * 20 + 10}px`;
             }
             taskCell.appendChild(descDiv);
         }
         
         if (isOffPlan) {
             const offPlanDiv = document.createElement('div');
             offPlanDiv.className = 'off-plan-indicator';
             offPlanDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Fuera del plan';
             if (level > 0) {
                 offPlanDiv.style.paddingLeft = `${level * 20 + 10}px`;
             }
             taskCell.appendChild(offPlanDiv);
         }
         
         fixedRow.appendChild(taskCell);
         
         // 2. Prioridad
         const priorityCell = document.createElement('td');
         priorityCell.className = 'col-priority';
         const prioritySpan = document.createElement('span');
         prioritySpan.className = `priority-badge priority-${task.priority}`;
         prioritySpan.textContent = this.getPriorityText(task.priority);
         priorityCell.appendChild(prioritySpan);
         fixedRow.appendChild(priorityCell);
         
         // 3. Inicio Plan
         const startPlanCell = document.createElement('td');
         startPlanCell.className = 'col-start-planned';
         const startPlanDiv = document.createElement('div');
         startPlanDiv.className = 'date-info';
         startPlanDiv.innerHTML = `
             <div class="date-value">${task.startPlanned ? this.formatDateDisplay(task.startPlanned) : '-'}</div>
             <div class="date-label">Inicio Plan</div>
         `;
         startPlanCell.appendChild(startPlanDiv);
         fixedRow.appendChild(startPlanCell);
         
         // 4. Duración Plan
        const durationPlanCell = document.createElement('td');
        durationPlanCell.className = 'col-duration-planned text-center';
        const durationPlanDiv = document.createElement('div');
        durationPlanDiv.className = `duration-info ${task.inheritedDurationPlanned ? 'inherited-duration' : ''}`;
        durationPlanDiv.innerHTML = `
            <div class="duration-value">${task.inheritedDurationPlanned || task.durationPlanned || '-'}${task.inheritedDurationPlanned ? ' 📊' : ''}</div>
            <div class="duration-label">días${task.inheritedDurationPlanned ? ' (Suma)' : ''}</div>
        `;
         durationPlanCell.appendChild(durationPlanDiv);
         fixedRow.appendChild(durationPlanCell);
         
         // 5. Duración Real
        const durationRealCell = document.createElement('td');
        durationRealCell.className = 'col-duration-actual text-center';
        const durationRealDiv = document.createElement('div');
        durationRealDiv.className = `duration-info ${task.inheritedDurationActual ? 'inherited-duration' : ''}`;
        durationRealDiv.innerHTML = `
            <div class="duration-value">${task.inheritedDurationActual || task.durationActual || '-'}${task.inheritedDurationActual ? ' 📊' : ''}</div>
            <div class="duration-label">${(task.inheritedDurationActual || task.durationActual) ? 'días' : ''}${task.inheritedDurationActual ? ' (Suma)' : ''}</div>
        `;
         durationRealCell.appendChild(durationRealDiv);
         fixedRow.appendChild(durationRealCell);
         
         // 6. Inicio Real
         const startRealCell = document.createElement('td');
         startRealCell.className = 'col-start-actual';
         const startRealDiv = document.createElement('div');
         const isDelayed = task.startActual && new Date(task.startActual) > new Date(task.startPlanned);
         startRealDiv.className = `date-info ${task.startActual ? (isDelayed ? 'delayed' : 'on-time') : ''}`;
         startRealDiv.innerHTML = `
             <div class="date-value">${task.startActual ? this.formatDateDisplay(task.startActual) : '-'}</div>
             <div class="date-label">Inicio Real</div>
         `;
         startRealCell.appendChild(startRealDiv);
         fixedRow.appendChild(startRealCell);
         
         // 7. Completado
        const completedCell = document.createElement('td');
        completedCell.className = 'col-progress text-center';
        completedCell.innerHTML = `
            <div class="progress-container ${task.isDynamicProgress ? 'dynamic-progress' : ''}">
                ${task.isDynamicProgress ? '<div class="progress-content">' : ''}
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${task.progress}%"></div>
                    </div>
                    <span class="progress-text">${task.progress}%${task.isDynamicProgress ? ' 🔄' : ''}</span>
                ${task.isDynamicProgress ? '</div>' : ''}
                ${task.isDynamicProgress ? '<div class="progress-label">Dinámico</div>' : ''}
            </div>
        `;
         fixedRow.appendChild(completedCell);
         
         fixedBody.appendChild(fixedRow);
        
        // Create days row
        const daysRow = document.createElement('tr');
        daysRow.className = 'task-row';
        if (level > 0) {
            daysRow.classList.add('subtask');
        }
        
        // Check if task has subtasks to make it expandable
        const currentProject = this.getCurrentProject();
        const hasSubtasks = level === 0 && Object.values(currentProject.tasks).some(t => t.parentId === task.id);
        if (hasSubtasks) {
            fixedRow.classList.add('parent-task');
            daysRow.classList.add('parent-task');
            
            // Add collapsed class if task is collapsed
            if (task.collapsed) {
                fixedRow.classList.add('collapsed');
                daysRow.classList.add('collapsed');
            }
        }
        
        // Add click handler for parent tasks
        if (hasSubtasks) {
            fixedRow.addEventListener('click', (e) => {
                if (e.target.closest('.task-name')) {
                    this.toggleHybridTaskExpansion(task.id);
                }
            });
        }
        
        // Get task date ranges for continuous bars
        const taskRanges = this.getTaskDateRanges(task, year, month);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('td');
            const currentDate = new Date(year, month, day);
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
            const isToday = currentDate.toDateString() === new Date().toDateString();
            
            dayCell.className = 'day-cell';
            if (isWeekend) dayCell.classList.add('weekend');
            if (isToday) dayCell.classList.add('today');
            
            // Add continuous task bars
            taskRanges.forEach(range => {
                if (day >= range.startDay && day <= range.endDay) {
                    const taskBar = document.createElement('div');
                    let barClass = `task-bar ${range.type} ${range.priority}`;
                    
                    // Add position classes for continuous appearance
                    if (day === range.startDay && day === range.endDay) {
                        barClass += ' single';
                    } else if (day === range.startDay) {
                        barClass += ' start';
                    } else if (day === range.endDay) {
                        barClass += ' end';
                    } else {
                        barClass += ' continuous';
                    }
                    
                    taskBar.className = barClass;
                    taskBar.style.width = '100%';
                    taskBar.style.left = '0';
                    
                    dayCell.appendChild(taskBar);
                }
            });
            
            daysRow.appendChild(dayCell);
        }
        
        daysBody.appendChild(daysRow);
    }
    
    syncHybridScroll() {
         const fixedContainer = document.querySelector('.hybrid-fixed-columns');
         const scrollContainer = document.querySelector('.hybrid-scroll-columns');
         
         if (fixedContainer && scrollContainer) {
             scrollContainer.addEventListener('scroll', () => {
                 fixedContainer.scrollTop = scrollContainer.scrollTop;
             });
             
             fixedContainer.addEventListener('scroll', () => {
                 scrollContainer.scrollTop = fixedContainer.scrollTop;
             });
         }
     }
    
    getTaskBarClass(task, date) {
        let classes = [task.priority || 'medium'];
        
        // Check if it's planned period
        if (task.startPlanned) {
            const plannedStart = new Date(task.startPlanned);
            const plannedEnd = new Date(plannedStart);
            plannedEnd.setDate(plannedEnd.getDate() + (task.durationPlanned || 1) - 1);
            
            if (date >= plannedStart && date <= plannedEnd) {
                classes.push('planned');
            }
        }
        
        // Check if it's actual period
        if (task.startActual) {
            const actualStart = new Date(task.startActual);
            const actualEnd = new Date(actualStart);
            actualEnd.setDate(actualEnd.getDate() + (task.durationActual || task.durationPlanned || 1) - 1);
            
            if (date >= actualStart && date <= actualEnd) {
                classes.push('actual');
            }
        }
        
        // Check completion status
        if (task.status === 'completed' || (task.progress && task.progress >= 100)) {
            classes.push('completed');
        }
        
        return classes.join(' ');
    }
    
    getTaskDateRanges(task, year, month) {
        const ranges = [];
        const priority = task.priority || 'medium';
        
        // Planned period
        if (task.startPlanned) {
            const plannedStart = new Date(task.startPlanned);
            const plannedEnd = new Date(plannedStart);
            plannedEnd.setDate(plannedEnd.getDate() + (task.durationPlanned || 1) - 1);
            
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0);
            
            if (plannedEnd >= monthStart && plannedStart <= monthEnd) {
                const startDay = Math.max(1, plannedStart.getMonth() === month && plannedStart.getFullYear() === year ? plannedStart.getDate() : 1);
                const endDay = Math.min(monthEnd.getDate(), plannedEnd.getMonth() === month && plannedEnd.getFullYear() === year ? plannedEnd.getDate() : monthEnd.getDate());
                
                ranges.push({
                    startDay,
                    endDay,
                    type: 'planned',
                    priority
                });
            }
        }
        
        // Actual period
        if (task.startActual) {
            const actualStart = new Date(task.startActual);
            const actualEnd = new Date(actualStart);
            actualEnd.setDate(actualEnd.getDate() + (task.durationActual || task.durationPlanned || 1) - 1);
            
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0);
            
            if (actualEnd >= monthStart && actualStart <= monthEnd) {
                const startDay = Math.max(1, actualStart.getMonth() === month && actualStart.getFullYear() === year ? actualStart.getDate() : 1);
                const endDay = Math.min(monthEnd.getDate(), actualEnd.getMonth() === month && actualEnd.getFullYear() === year ? actualEnd.getDate() : monthEnd.getDate());
                
                ranges.push({
                    startDay,
                    endDay,
                    type: 'actual',
                    priority
                });
            }
        }
        
        return ranges;
    }
    
    toggleHybridTaskExpansion(taskId) {
        const currentProject = this.getCurrentProject();
        if (!currentProject) return;
        
        // Find the task
        const task = currentProject.tasks[taskId];
        if (!task) return;
        
        // Check if task has subtasks
        const hasSubtasks = Object.values(currentProject.tasks).some(t => t.parentId === taskId);
        if (!hasSubtasks) return;
        
        // Toggle collapsed state
        task.collapsed = !task.collapsed;
        
        // Re-render the hybrid view
        this.renderHybridView();
        
        // Save to storage
        this.saveToStorage();
    }
    
    // Calcular progreso dinámico para tareas padre
    calculateParentProgress(parentTaskId) {
        const currentProject = this.getCurrentProject();
        if (!currentProject) return 0;
        
        const subtasks = Object.values(currentProject.tasks).filter(task => task.parentId === parentTaskId);
        if (subtasks.length === 0) return null; // No es tarea padre
        
        // Calcular progreso ponderado por duración planificada
        let totalWeightedProgress = 0;
        let totalDuration = 0;
        
        subtasks.forEach(subtask => {
            const duration = subtask.durationPlanned || 1;
            totalWeightedProgress += (subtask.progress || 0) * duration;
            totalDuration += duration;
        });
        
        return totalDuration > 0 ? Math.round(totalWeightedProgress / totalDuration) : 0;
    }
    
    // Calcular duración heredada para tareas padre
    calculateParentDuration(parentTaskId) {
        const currentProject = this.getCurrentProject();
        if (!currentProject) return { planned: 0, actual: 0 };
        
        const subtasks = Object.values(currentProject.tasks).filter(task => task.parentId === parentTaskId);
        if (subtasks.length === 0) return null;
        
        const plannedDuration = subtasks.reduce((sum, subtask) => sum + (subtask.durationPlanned || 0), 0);
        const actualDuration = subtasks.reduce((sum, subtask) => sum + (subtask.durationActual || 0), 0);
        
        return { planned: plannedDuration, actual: actualDuration };
    }
    
    // Calcular fechas heredadas para tareas padre
    calculateParentDates(parentTaskId) {
        const currentProject = this.getCurrentProject();
        if (!currentProject) return { startPlanned: null, startActual: null };
        
        const subtasks = Object.values(currentProject.tasks).filter(task => task.parentId === parentTaskId);
        if (subtasks.length === 0) return null;
        
        // Fecha de inicio planificada más temprana
        const plannedDates = subtasks.map(task => new Date(task.startPlanned)).filter(date => !isNaN(date));
        const startPlanned = plannedDates.length > 0 ? new Date(Math.min(...plannedDates)) : null;
        
        // Fecha de inicio real más temprana
        const actualDates = subtasks.map(task => task.startActual ? new Date(task.startActual) : null).filter(date => date !== null);
        const startActual = actualDates.length > 0 ? new Date(Math.min(...actualDates)) : null;
        
        return {
            startPlanned: startPlanned ? this.formatDate(startPlanned) : null,
            startActual: startActual ? this.formatDate(startActual) : null
        };
    }
    
    // Actualizar progreso de todas las tareas padre
    updateParentTasksProgress() {
        const currentProject = this.getCurrentProject();
        if (!currentProject) return;
        
        const parentTasks = Object.values(currentProject.tasks).filter(task => 
            !task.parentId && Object.values(currentProject.tasks).some(t => t.parentId === task.id)
        );
        
        parentTasks.forEach(parentTask => {
            const calculatedProgress = this.calculateParentProgress(parentTask.id);
            const calculatedDuration = this.calculateParentDuration(parentTask.id);
            const calculatedDates = this.calculateParentDates(parentTask.id);
            
            if (calculatedProgress !== null) {
                parentTask.progress = calculatedProgress;
                parentTask.isDynamicProgress = true;
                
                // Actualizar la interfaz visual inmediatamente
                this.updateProgressVisual(parentTask.id, calculatedProgress);
            }
            
            if (calculatedDuration !== null) {
                parentTask.inheritedDurationPlanned = calculatedDuration.planned;
                parentTask.inheritedDurationActual = calculatedDuration.actual;
            }
            
            if (calculatedDates !== null) {
                if (calculatedDates.startPlanned) {
                    parentTask.inheritedStartPlanned = calculatedDates.startPlanned;
                }
                if (calculatedDates.startActual) {
                    parentTask.inheritedStartActual = calculatedDates.startActual;
                }
            }
        });
    }
    
    // Actualizar la visualización del progreso para una tarea específica
    updateProgressVisual(taskId, progress) {
        // Buscar todos los elementos de progreso para esta tarea
        const progressContainers = document.querySelectorAll(`[data-task-id="${taskId}"] .progress-container, .progress-container[data-task-id="${taskId}"]`);
        
        progressContainers.forEach(container => {
            const progressFill = container.querySelector('.progress-fill');
            const progressText = container.querySelector('.progress-text');
            
            if (progressFill && progressText) {
                // Actualizar la barra de progreso
                progressFill.style.width = `${progress}%`;
                progressFill.setAttribute('data-progress', progress);
                
                // Actualizar el texto del progreso
                const isDynamic = progressText.textContent.includes('🔄');
                progressText.textContent = `${progress}%${isDynamic ? ' 🔄' : ''}`;
                progressText.setAttribute('data-progress', progress);
            }
        });
        
        // También buscar por ID de fila de tarea
        const taskRows = document.querySelectorAll(`#task-${taskId}`);
        taskRows.forEach(row => {
            const progressContainers = row.querySelectorAll('.progress-container');
            progressContainers.forEach(container => {
                const progressFill = container.querySelector('.progress-fill');
                const progressText = container.querySelector('.progress-text');
                
                if (progressFill && progressText) {
                    progressFill.style.width = `${progress}%`;
                    progressFill.setAttribute('data-progress', progress);
                    
                    const isDynamic = progressText.textContent.includes('🔄');
                    progressText.textContent = `${progress}%${isDynamic ? ' 🔄' : ''}`;
                    progressText.setAttribute('data-progress', progress);
                }
            });
        });
    }
    
    // Función para validar y corregir discrepancias en barras de progreso
    validateAndFixProgressBars() {
        const progressContainers = document.querySelectorAll('.progress-container');
        let fixedCount = 0;
        
        progressContainers.forEach(container => {
            const progressFill = container.querySelector('.progress-fill');
            const progressText = container.querySelector('.progress-text');
            
            if (progressFill && progressText) {
                const fillDataProgress = progressFill.getAttribute('data-progress');
                const textDataProgress = progressText.getAttribute('data-progress');
                
                // Extraer el porcentaje del texto
                const textMatch = progressText.textContent.match(/(\d+)%/);
                const textProgress = textMatch ? parseInt(textMatch[1]) : 0;
                
                // Extraer el porcentaje del width
                const widthMatch = progressFill.style.width.match(/(\d+)%/);
                const widthProgress = widthMatch ? parseInt(widthMatch[1]) : 0;
                
                // Verificar discrepancia
                if (textProgress !== widthProgress) {
                    console.warn(`Discrepancia detectada: Texto ${textProgress}% vs Width ${widthProgress}%`);
                    
                    // Usar el valor de data-progress como fuente de verdad
                    const correctProgress = fillDataProgress || textDataProgress || textProgress;
                    
                    // Corregir ambos valores
                    progressFill.style.width = `${correctProgress}%`;
                    const isDynamic = progressText.textContent.includes('🔄');
                    progressText.textContent = `${correctProgress}%${isDynamic ? ' 🔄' : ''}`;
                    
                    fixedCount++;
                    console.log(`Corregido: Ahora ambos muestran ${correctProgress}%`);
                }
            }
        });
        
        if (fixedCount > 0) {
            console.log(`Se corrigieron ${fixedCount} discrepancias en barras de progreso`);
        }
        
        return fixedCount;
    }
    
    getStatusText(status) {
        const statusMap = {
            'pending': 'Pendiente',
            'in-progress': 'En Progreso',
            'completed': 'Completada',
            'on-hold': 'En Espera'
        };
        return statusMap[status] || status;
    }
}

// ===== FUNCIONES DE CONFIGURACIÓN Y TEMAS =====

// Variable global para el tema actual
let currentTheme = null;

// Función para abrir el modal de configuración
function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.classList.add('show');
    showSettingsTab('themes'); // Mostrar la pestaña de temas por defecto
}

// Función para cerrar el modal de configuración
function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.classList.remove('show');
}

// Función para cambiar entre pestañas de configuración
function showSettingsTab(tabName) {
    // Ocultar todas las pestañas
    const tabs = document.querySelectorAll('.settings-tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Desactivar todos los botones
    const buttons = document.querySelectorAll('.settings-tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Mostrar la pestaña seleccionada
    document.getElementById(tabName + '-tab').classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// Función para manejar la carga de archivos de tema
function setupThemeUpload() {
    const fileInput = document.getElementById('themeFileInput');
    const dropZone = document.getElementById('themeDropZone');
    
    if (!fileInput || !dropZone) return;
    
    // Manejar clic en la zona de drop
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Manejar drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleThemeFile(files[0]);
        }
    });
    
    // Manejar selección de archivo
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleThemeFile(e.target.files[0]);
        }
    });
}

// Función para procesar el archivo de tema
function handleThemeFile(file) {
    if (file.type !== 'application/json') {
        alert('Por favor, selecciona un archivo JSON válido.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const themeData = JSON.parse(e.target.result);
            validateAndPreviewTheme(themeData);
        } catch (error) {
            alert('Error al leer el archivo JSON: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Función para validar y mostrar vista previa del tema
function validateAndPreviewTheme(themeData) {
    // Validar estructura básica del tema
    if (!themeData.name || !themeData.colors) {
        alert('El archivo de tema no tiene la estructura correcta. Debe contener al menos "name" y "colors".');
        return;
    }
    
    currentTheme = themeData;
    showThemePreview(themeData);
}

// Función para mostrar la vista previa del tema
function showThemePreview(themeData) {
    const preview = document.getElementById('themePreview');
    const themeName = document.getElementById('themeName');
    const themeColors = document.getElementById('themeColors');
    
    if (!preview || !themeName || !themeColors) return;
    
    preview.style.display = 'block';
    themeName.textContent = themeData.name;
    
    // Mostrar colores del tema
    themeColors.innerHTML = '';
    if (themeData.colors) {
        Object.entries(themeData.colors).forEach(([key, value]) => {
            const colorSpan = document.createElement('span');
            colorSpan.style.backgroundColor = value;
            colorSpan.style.width = '20px';
            colorSpan.style.height = '20px';
            colorSpan.style.display = 'inline-block';
            colorSpan.style.marginRight = '5px';
            colorSpan.style.borderRadius = '3px';
            colorSpan.title = `${key}: ${value}`;
            themeColors.appendChild(colorSpan);
        });
    }
}

// Función para resetear la vista previa del tema
function resetThemePreview() {
    const preview = document.getElementById('themePreview');
    if (preview) {
        preview.style.display = 'none';
    }
    currentTheme = null;
}

// Función para exportar el tema actual
function exportCurrentTheme() {
    const savedTheme = localStorage.getItem('selectedTheme');
    if (!savedTheme) {
        alert('No hay un tema personalizado guardado para exportar.');
        return;
    }
    
    try {
        const themeData = JSON.parse(savedTheme);
        const dataStr = JSON.stringify(themeData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${themeData.name || 'tema_personalizado'}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
    } catch (error) {
        alert('Error al exportar el tema: ' + error.message);
    }
}

// Función para aplicar el tema
function applyTheme(themeData = currentTheme) {
    if (!themeData || !themeData.colors) {
        alert('No hay un tema válido para aplicar.');
        return;
    }
    
    const root = document.documentElement;
    
    // Aplicar colores del tema
    Object.entries(themeData.colors).forEach(([property, value]) => {
        root.style.setProperty(`--${property}`, value);
    });
    
    // Aplicar tipografía
    if (themeData.typography) {
        if (themeData.typography['font-family']) {
            root.style.setProperty('--font-family', themeData.typography['font-family']);
            document.body.style.fontFamily = themeData.typography['font-family'];
        }
        if (themeData.typography['font-size-base']) {
            root.style.setProperty('--font-size-base', themeData.typography['font-size-base']);
        }
        if (themeData.typography['font-weight-normal']) {
            root.style.setProperty('--font-weight-normal', themeData.typography['font-weight-normal']);
        }
        if (themeData.typography['font-weight-bold']) {
            root.style.setProperty('--font-weight-bold', themeData.typography['font-weight-bold']);
        }
    }
    
    // Aplicar espaciado
    if (themeData.spacing) {
        Object.entries(themeData.spacing).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });
    }
    
    // Aplicar bordes
    if (themeData.borders) {
        Object.entries(themeData.borders).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });
        // Actualizar border-radius principal si existe
        if (themeData.borders['radius-medium']) {
            root.style.setProperty('--border-radius', themeData.borders['radius-medium']);
        }
    }
    
    // Aplicar sombras
    if (themeData.shadows) {
        if (themeData.shadows.small) {
            root.style.setProperty('--shadow-sm', themeData.shadows.small);
        }
        if (themeData.shadows.medium) {
            root.style.setProperty('--shadow-md', themeData.shadows.medium);
        }
        if (themeData.shadows.large) {
            root.style.setProperty('--shadow-lg', themeData.shadows.large);
        }
    }
    
    // Guardar tema en localStorage
    localStorage.setItem('currentTheme', JSON.stringify(themeData));
    currentTheme = themeData;
    
    // Ocultar vista previa
    resetThemePreview();
    
    alert(`Tema "${themeData.name}" aplicado correctamente.`);
    closeSettingsModal();
}

// Función para resetear al tema por defecto
function resetToDefaultTheme() {
    const root = document.documentElement;
    
    // Remover todas las variables CSS personalizadas
    const customProperties = [
        'primary-color', 'primary-hover', 'secondary-color', 'success-color',
        'warning-color', 'danger-color', 'info-color', 'text-primary',
        'text-secondary', 'background-color', 'surface-color', 'border-color'
    ];
    
    customProperties.forEach(property => {
        root.style.removeProperty(`--${property}`);
    });
    
    // Remover tema del localStorage
    localStorage.removeItem('currentTheme');
    
    alert('Tema restablecido al diseño por defecto.');
    closeSettingsModal();
}

// Función para cargar tema guardado al iniciar
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('currentTheme');
    if (savedTheme) {
        try {
            const themeData = JSON.parse(savedTheme);
            currentTheme = themeData;
            
            const root = document.documentElement;
            
            // Aplicar colores del tema
            if (themeData.colors) {
                Object.entries(themeData.colors).forEach(([property, value]) => {
                    root.style.setProperty(`--${property}`, value);
                });
            }
            
            // Aplicar tipografía
            if (themeData.typography) {
                if (themeData.typography['font-family']) {
                    root.style.setProperty('--font-family', themeData.typography['font-family']);
                    document.body.style.fontFamily = themeData.typography['font-family'];
                }
                if (themeData.typography['font-size-base']) {
                    root.style.setProperty('--font-size-base', themeData.typography['font-size-base']);
                }
                if (themeData.typography['font-weight-normal']) {
                    root.style.setProperty('--font-weight-normal', themeData.typography['font-weight-normal']);
                }
                if (themeData.typography['font-weight-bold']) {
                    root.style.setProperty('--font-weight-bold', themeData.typography['font-weight-bold']);
                }
            }
            
            // Aplicar espaciado
            if (themeData.spacing) {
                Object.entries(themeData.spacing).forEach(([key, value]) => {
                    root.style.setProperty(`--${key}`, value);
                });
            }
            
            // Aplicar bordes
            if (themeData.borders) {
                Object.entries(themeData.borders).forEach(([key, value]) => {
                    root.style.setProperty(`--${key}`, value);
                });
                if (themeData.borders['radius-medium']) {
                    root.style.setProperty('--border-radius', themeData.borders['radius-medium']);
                }
            }
            
            // Aplicar sombras
            if (themeData.shadows) {
                if (themeData.shadows.small) {
                    root.style.setProperty('--shadow-sm', themeData.shadows.small);
                }
                if (themeData.shadows.medium) {
                    root.style.setProperty('--shadow-md', themeData.shadows.medium);
                }
                if (themeData.shadows.large) {
                    root.style.setProperty('--shadow-lg', themeData.shadows.large);
                }
            }
        } catch (error) {
            console.error('Error al cargar el tema guardado:', error);
            // Si hay error, cargar tema por defecto
            applyPredefinedTheme('reybesa');
        }
    } else {
        // Si no hay tema guardado, aplicar tema Reybesa por defecto
        applyPredefinedTheme('reybesa');
    }
}

// Función para aplicar tema predefinido
function applyPredefinedTheme(themeName) {
    const predefinedThemes = {
        'default': {
            name: 'Tema por Defecto',
            colors: {
                'primary-color': '#1976d2',
                'primary-hover': '#1565c0',
                'success-color': '#4caf50',
                'warning-color': '#ff9800',
                'danger-color': '#f44336',
                'text-primary': '#333333',
                'text-secondary': '#666666',
                'background-color': '#ffffff',
                'surface-color': '#f5f5f5',
                'border-color': '#e0e0e0'
            }
        },
        'reybesa': {
            name: 'Tema Reybesa',
            colors: {
                'primary-color': '#A00020',
                'primary-hover': '#800018',
                'success-color': '#59A472',
                'warning-color': '#FFC700',
                'danger-color': '#A00020',
                'secondary-color': '#19423F',
                'text-primary': '#333333',
                'text-secondary': '#666666',
                'background-color': '#ffffff',
                'surface-color': '#f8f9fa',
                'border-color': '#dee2e6'
            }
        },
        'dark': {
            name: 'Tema Oscuro',
            colors: {
                'primary-color': '#3b82f6',
                'primary-hover': '#2563eb',
                'text-primary': '#f8fafc',
                'text-secondary': '#cbd5e1',
                'background-color': '#1e293b',
                'surface-color': '#334155',
                'border-color': '#475569'
            }
        }
    };
    
    const theme = predefinedThemes[themeName];
    if (theme) {
        applyTheme(theme);
        // Guardar el tema aplicado en localStorage
        try {
            localStorage.setItem('selectedTheme', JSON.stringify(theme));
            console.log(`Tema ${theme.name} aplicado correctamente`);
        } catch (error) {
            console.error('Error guardando tema:', error);
        }
    } else {
        console.error(`Tema '${themeName}' no encontrado`);
    }
}

// Funciones globales para eventos HTML
function closeModal(modalId) {
    projectManager.closeModal(modalId);
}

function saveProject() {
    projectManager.saveProject();
}

function saveTask() {
    projectManager.saveTask();
}

function updateProgressValue(value) {
    document.getElementById('progressValue').textContent = `${value}%`;
}

function closeProject(projectId) {
    projectManager.closeProject(projectId);
}

// Inicializar la aplicación
let projectManager;
let authManager;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar autenticación primero
    authManager = new AuthManager();
    
    // Luego inicializar el gestor de proyectos
    projectManager = new ProjectManager();
    
    // Configurar funcionalidades de temas
    setupThemeUpload();
    loadSavedTheme();
    
    // Integrar autenticación con la aplicación
    integrateAuthWithApp();
});

// Guardar automáticamente cada 30 segundos
setInterval(() => {
    if (projectManager) {
        projectManager.saveToStorage();
    }
}, 30000);

// Guardar antes de cerrar la página
window.addEventListener('beforeunload', () => {
    if (projectManager) {
        projectManager.saveToStorage();
    }
});

// ===== SISTEMA DE AUTENTICACIÓN =====

// Clase para manejar la autenticación de usuarios
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkSession();
        this.updateUI();
    }

    setupEventListeners() {
        // Event listeners para formularios
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProfileUpdate();
        });

        document.getElementById('addUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddUser();
        });

        // Event listener para el menú de usuario
        document.getElementById('userBtn').addEventListener('click', () => {
            this.toggleUserDropdown();
        });

        // Event listener para cambio de foto de perfil
        document.getElementById('photoInput').addEventListener('change', (e) => {
            this.handlePhotoChange(e);
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                this.closeUserDropdown();
            }
        });

        // Event listener para búsqueda de usuarios en admin
        document.getElementById('adminSearchUsers').addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });
    }

    // Cargar usuarios del localStorage
    loadUsers() {
        const users = localStorage.getItem('plannerUsers');
        if (users) {
            return JSON.parse(users);
        } else {
            // Crear usuario administrador por defecto
            const defaultUsers = {
                'admin@planner.com': {
                    id: 'admin-001',
                    name: 'Administrador',
                    email: 'admin@planner.com',
                    password: 'admin123', // En producción esto debería estar hasheado
                    role: 'admin',
                    photo: 'https://via.placeholder.com/100x100/4f46e5/ffffff?text=A',
                    createdAt: new Date().toISOString(),
                    status: 'active'
                }
            };
            this.saveUsers(defaultUsers);
            return defaultUsers;
        }
    }

    // Guardar usuarios en localStorage
    saveUsers(users = this.users) {
        localStorage.setItem('plannerUsers', JSON.stringify(users));
        this.users = users;
    }

    // Verificar sesión existente
    checkSession() {
        const session = localStorage.getItem('plannerSession');
        if (session) {
            const sessionData = JSON.parse(session);
            const user = this.users[sessionData.email];
            if (user && sessionData.timestamp > Date.now() - (24 * 60 * 60 * 1000)) { // 24 horas
                this.currentUser = user;
                return true;
            } else {
                localStorage.removeItem('plannerSession');
            }
        }
        return false;
    }

    // Crear sesión
    createSession(user) {
        const sessionData = {
            email: user.email,
            timestamp: Date.now()
        };
        localStorage.setItem('plannerSession', JSON.stringify(sessionData));
        this.currentUser = user;
    }

    // Manejar login
    handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const user = this.users[email];
        if (user && user.password === password && user.status === 'active') {
            this.createSession(user);
            this.updateUI();
            closeModal('loginModal');
            this.showNotification('¡Bienvenido! Has iniciado sesión correctamente.', 'success');
        } else {
            this.showNotification('Email o contraseña incorrectos.', 'error');
        }
    }

    // Manejar registro
    handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validaciones
        if (password !== confirmPassword) {
            this.showNotification('Las contraseñas no coinciden.', 'error');
            return;
        }

        if (this.users[email]) {
            this.showNotification('Ya existe un usuario con este email.', 'error');
            return;
        }

        // Crear nuevo usuario
        const newUser = {
            id: 'user-' + Date.now(),
            name: name,
            email: email,
            password: password,
            role: 'user',
            photo: 'https://via.placeholder.com/100x100/4f46e5/ffffff?text=' + name.charAt(0).toUpperCase(),
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        this.users[email] = newUser;
        this.saveUsers();
        this.createSession(newUser);
        this.updateUI();
        closeModal('registerModal');
        this.showNotification('¡Cuenta creada exitosamente! Bienvenido.', 'success');
    }

    // Manejar actualización de perfil
    handleProfileUpdate() {
        if (!this.currentUser) return;

        const name = document.getElementById('profileName').value;
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;

        // Verificar contraseña actual si se quiere cambiar algo
        if ((newPassword || name !== this.currentUser.name) && currentPassword !== this.currentUser.password) {
            this.showNotification('Contraseña actual incorrecta.', 'error');
            return;
        }

        // Actualizar datos
        this.currentUser.name = name;
        if (newPassword) {
            this.currentUser.password = newPassword;
        }

        this.users[this.currentUser.email] = this.currentUser;
        this.saveUsers();
        this.updateUI();
        closeModal('profileModal');
        this.showNotification('Perfil actualizado correctamente.', 'success');

        // Limpiar campos de contraseña
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
    }

    // Manejar cambio de foto de perfil
    handlePhotoChange(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const photoUrl = e.target.result;
                document.getElementById('profileImage').src = photoUrl;
                if (this.currentUser) {
                    this.currentUser.photo = photoUrl;
                    this.users[this.currentUser.email] = this.currentUser;
                    this.saveUsers();
                    this.updateUI();
                }
            };
            reader.readAsDataURL(file);
        }
    }

    // Manejar agregar usuario (solo admin)
    handleAddUser() {
        if (!this.currentUser || this.currentUser.role !== 'admin') return;

        const name = document.getElementById('addUserName').value;
        const email = document.getElementById('addUserEmail').value;
        const password = document.getElementById('addUserPassword').value;
        const role = document.getElementById('addUserRole').value;

        if (this.users[email]) {
            this.showNotification('Ya existe un usuario con este email.', 'error');
            return;
        }

        const newUser = {
            id: 'user-' + Date.now(),
            name: name,
            email: email,
            password: password,
            role: role,
            photo: 'https://via.placeholder.com/100x100/4f46e5/ffffff?text=' + name.charAt(0).toUpperCase(),
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        this.users[email] = newUser;
        this.saveUsers();
        this.loadUsersTable();
        this.updateAdminStats();
        closeModal('addUserModal');
        this.showNotification('Usuario creado exitosamente.', 'success');

        // Limpiar formulario
        document.getElementById('addUserForm').reset();
    }

    // Cerrar sesión
    logout() {
        localStorage.removeItem('plannerSession');
        this.currentUser = null;
        this.updateUI();
        this.showNotification('Has cerrado sesión correctamente.', 'info');
    }

    // Actualizar interfaz de usuario
    updateUI() {
        const userNameDisplay = document.getElementById('userNameDisplay');
        const guestOptions = document.getElementById('guestOptions');
        const userOptions = document.getElementById('userOptions');
        const adminOption = document.getElementById('adminOption');

        if (this.currentUser) {
            userNameDisplay.textContent = this.currentUser.name;
            guestOptions.style.display = 'none';
            userOptions.style.display = 'block';
            
            if (this.currentUser.role === 'admin') {
                adminOption.style.display = 'block';
            } else {
                adminOption.style.display = 'none';
            }
        } else {
            userNameDisplay.textContent = 'Invitado';
            guestOptions.style.display = 'block';
            userOptions.style.display = 'none';
            adminOption.style.display = 'none';
        }
    }

    // Toggle dropdown del usuario
    toggleUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.toggle('show');
    }

    // Cerrar dropdown del usuario
    closeUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.remove('show');
    }

    // Cargar tabla de usuarios en admin panel
    loadUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        Object.values(this.users).forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${user.photo}" alt="${user.name}" class="user-photo"></td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="user-role role-${user.role}">${user.role === 'admin' ? 'Administrador' : 'Usuario'}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td><span class="user-status status-${user.status}">${user.status === 'active' ? 'Activo' : 'Inactivo'}</span></td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-outline" onclick="authManager.editUser('${user.email}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="authManager.toggleUserStatus('${user.email}')" title="${user.status === 'active' ? 'Desactivar' : 'Activar'}">
                        <i class="fas fa-${user.status === 'active' ? 'ban' : 'check'}"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Filtrar usuarios en la tabla
    filterUsers(searchTerm) {
        const rows = document.querySelectorAll('#usersTableBody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // Actualizar estadísticas del admin
    updateAdminStats() {
        const users = Object.values(this.users);
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.status === 'active').length;
        const adminUsers = users.filter(u => u.role === 'admin').length;

        document.getElementById('totalUsersCount').textContent = totalUsers;
        document.getElementById('activeUsersCount').textContent = activeUsers;
        document.getElementById('adminUsersCount').textContent = adminUsers;
    }

    // Editar usuario
    editUser(email) {
        // Implementar modal de edición de usuario
        this.showNotification('Función de edición en desarrollo.', 'info');
    }

    // Cambiar estado del usuario
    toggleUserStatus(email) {
        const user = this.users[email];
        if (user && user.email !== this.currentUser.email) {
            user.status = user.status === 'active' ? 'inactive' : 'active';
            this.saveUsers();
            this.loadUsersTable();
            this.updateAdminStats();
            this.showNotification(`Usuario ${user.status === 'active' ? 'activado' : 'desactivado'} correctamente.`, 'success');
        }
    }

    // Mostrar notificación
    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;

        // Agregar estilos si no existen
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--surface-color);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 10000;
                    max-width: 400px;
                    animation: slideIn 0.3s ease;
                }
                .notification-success { border-left: 4px solid #10b981; }
                .notification-error { border-left: 4px solid #ef4444; }
                .notification-info { border-left: 4px solid #3b82f6; }
                .notification button {
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    color: var(--text-secondary);
                    margin-left: auto;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Funciones globales para los modales de autenticación
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.getElementById('loginEmail').focus();
}

function showRegisterModal() {
    closeModal('loginModal');
    document.getElementById('registerModal').style.display = 'block';
    document.getElementById('registerName').focus();
}

function showProfileModal() {
    if (!authManager.currentUser) return;
    
    // Llenar datos del perfil
    document.getElementById('profileName').value = authManager.currentUser.name;
    document.getElementById('profileEmail').value = authManager.currentUser.email;
    document.getElementById('profileRole').value = authManager.currentUser.role === 'admin' ? 'Administrador' : 'Usuario';
    document.getElementById('profileImage').src = authManager.currentUser.photo;
    
    document.getElementById('profileModal').style.display = 'block';
    authManager.closeUserDropdown();
}

function showAdminPanel() {
    if (!authManager.currentUser || authManager.currentUser.role !== 'admin') return;
    
    document.getElementById('adminPanel').style.display = 'block';
    authManager.loadUsersTable();
    authManager.updateAdminStats();
    authManager.closeUserDropdown();
}

function showAddUserModal() {
    document.getElementById('addUserModal').style.display = 'block';
}

function showAdminTab(tabName) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar pestaña seleccionada
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

function changeProfilePhoto() {
    document.getElementById('photoInput').click();
}

function logout() {
    authManager.logout();
    authManager.closeUserDropdown();
}

// Función para integrar autenticación con la aplicación
function integrateAuthWithApp() {
    // Verificar permisos de usuario para ciertas funciones
    const restrictedButtons = [
        'addProjectBtn',
        'exportBtn'
    ];
    
    // Función para actualizar permisos de UI
    function updateUIPermissions() {
        const isLoggedIn = authManager.currentUser !== null;
        const isAdmin = authManager.currentUser && authManager.currentUser.role === 'admin';
        
        // Mostrar/ocultar funciones según el estado de autenticación
        restrictedButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                if (isLoggedIn) {
                    button.style.display = '';
                    button.disabled = false;
                } else {
                    // Para usuarios no autenticados, mostrar pero deshabilitar
                    button.style.opacity = '0.5';
                    button.disabled = true;
                    button.title = 'Inicia sesión para usar esta función';
                }
            }
        });
        
        // Agregar indicador de usuario en el proyecto actual
        if (isLoggedIn && projectManager.currentProject) {
            const project = projectManager.getCurrentProject();
            if (project && !project.owner) {
                project.owner = authManager.currentUser.email;
                project.ownerName = authManager.currentUser.name;
                projectManager.saveToStorage();
            }
        }
    }
    
    // Interceptar funciones que requieren autenticación
    const originalShowProjectModal = projectManager.showProjectModal;
    projectManager.showProjectModal = function(projectId = null) {
        if (!authManager.currentUser) {
            authManager.showNotification('Debes iniciar sesión para crear o editar proyectos.', 'error');
            showLoginModal();
            return;
        }
        originalShowProjectModal.call(this, projectId);
    };
    
    const originalShowTaskModal = projectManager.showTaskModal;
    projectManager.showTaskModal = function(taskId = null, parentId = null) {
        if (!authManager.currentUser) {
            authManager.showNotification('Debes iniciar sesión para crear o editar tareas.', 'error');
            showLoginModal();
            return;
        }
        originalShowTaskModal.call(this, taskId, parentId);
    };
    
    const originalExportData = projectManager.exportData;
    projectManager.exportData = function() {
        if (!authManager.currentUser) {
            authManager.showNotification('Debes iniciar sesión para exportar datos.', 'error');
            showLoginModal();
            return;
        }
        originalExportData.call(this);
    };
    
    // Actualizar UI cuando cambie el estado de autenticación
    const originalUpdateUI = authManager.updateUI;
    authManager.updateUI = function() {
        originalUpdateUI.call(this);
        updateUIPermissions();
        
        // Actualizar información del proyecto si hay usuario logueado
        if (this.currentUser && projectManager.currentProject) {
            projectManager.renderProjects();
        }
    };
    
    // Llamar inicialmente
    updateUIPermissions();
    
    // Agregar información de usuario a los datos exportados
    const originalGetExportData = projectManager.getExportData || function() {
        return {
            projects: this.projects,
            currentProject: this.currentProject,
            exportDate: new Date().toISOString()
        };
    };
    
    projectManager.getExportData = function() {
        const data = originalGetExportData.call(this);
        if (authManager.currentUser) {
            data.exportedBy = {
                name: authManager.currentUser.name,
                email: authManager.currentUser.email,
                date: new Date().toISOString()
            };
        }
        return data;
    };
}