-- Esquema completo de base de datos para Project Planner en Supabase
-- Ejecutar este script en el SQL Editor de Supabase

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    profile_photo TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de categorías de proyectos
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3498db', -- Color hexadecimal
    icon VARCHAR(50) DEFAULT 'folder',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    budget DECIMAL(12,2),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_to UUID[] DEFAULT '{}', -- Array de UUIDs de usuarios asignados
    tags TEXT[] DEFAULT '{}', -- Array de tags
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de tareas
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- Para subtareas
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    due_date TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2),
    tags TEXT[] DEFAULT '{}',
    dependencies UUID[] DEFAULT '{}', -- Array de IDs de tareas dependientes
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- Para respuestas
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT comment_belongs_to_project_or_task CHECK (
        (project_id IS NOT NULL AND task_id IS NULL) OR 
        (project_id IS NULL AND task_id IS NOT NULL)
    )
);

-- Tabla de archivos adjuntos
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL, -- URL del archivo en Supabase Storage
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT attachment_belongs_to_entity CHECK (
        (project_id IS NOT NULL AND task_id IS NULL AND comment_id IS NULL) OR 
        (project_id IS NULL AND task_id IS NOT NULL AND comment_id IS NULL) OR
        (project_id IS NULL AND task_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'task_assigned', 'project_updated', 'comment_added', etc.
    entity_type VARCHAR(50), -- 'project', 'task', 'comment'
    entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de actividad/historial
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'deleted', 'assigned', etc.
    entity_type VARCHAR(50) NOT NULL, -- 'project', 'task', 'comment', etc.
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_comments_project ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular progreso de proyecto basado en tareas
CREATE OR REPLACE FUNCTION calculate_project_progress(project_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
    progress_percentage INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_tasks
    FROM tasks
    WHERE project_id = project_uuid AND parent_task_id IS NULL;
    
    IF total_tasks = 0 THEN
        RETURN 0;
    END IF;
    
    SELECT COUNT(*) INTO completed_tasks
    FROM tasks
    WHERE project_id = project_uuid 
    AND parent_task_id IS NULL 
    AND status = 'completed';
    
    progress_percentage := ROUND((completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100);
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar progreso del proyecto cuando cambia una tarea
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects 
    SET progress = calculate_project_progress(COALESCE(NEW.project_id, OLD.project_id))
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_progress
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_project_progress();

-- Insertar categorías por defecto
INSERT INTO categories (name, description, color, icon) VALUES
('Desarrollo', 'Proyectos de desarrollo de software', '#3498db', 'code'),
('Marketing', 'Campañas y estrategias de marketing', '#e74c3c', 'bullhorn'),
('Diseño', 'Proyectos de diseño gráfico y UX/UI', '#9b59b6', 'paint-brush'),
('Investigación', 'Proyectos de investigación y análisis', '#f39c12', 'search'),
('General', 'Proyectos generales', '#95a5a6', 'folder')
ON CONFLICT DO NOTHING;

-- Insertar usuario administrador por defecto
INSERT INTO users (name, username, email, password_hash, role) VALUES
('Administrador', 'admin123', 'admin@planner.com', crypt('admin123', gen_salt('bf')), 'admin')
ON CONFLICT (username) DO NOTHING;

-- Habilitar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (los usuarios pueden ver sus propios datos)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Users can view projects they created or are assigned to" ON projects
    FOR SELECT USING (
        auth.uid() = created_by OR 
        auth.uid() = ANY(assigned_to)
    );

CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Project creators can update their projects" ON projects
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can view tasks in their projects" ON tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = tasks.project_id 
            AND (p.created_by = auth.uid() OR auth.uid() = ANY(p.assigned_to))
        )
    );

CREATE POLICY "Users can create tasks in their projects" ON tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = tasks.project_id 
            AND (p.created_by = auth.uid() OR auth.uid() = ANY(p.assigned_to))
        )
    );

CREATE POLICY "Users can update tasks assigned to them or in their projects" ON tasks
    FOR UPDATE USING (
        auth.uid() = assigned_to OR
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = tasks.project_id 
            AND p.created_by = auth.uid()
        )
    );

-- Comentarios: usuarios pueden ver comentarios en proyectos/tareas que pueden ver
CREATE POLICY "Users can view comments in accessible projects/tasks" ON comments
    FOR SELECT USING (
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = comments.project_id 
            AND (p.created_by = auth.uid() OR auth.uid() = ANY(p.assigned_to))
        )) OR
        (task_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM tasks t 
            JOIN projects p ON p.id = t.project_id
            WHERE t.id = comments.task_id 
            AND (p.created_by = auth.uid() OR auth.uid() = ANY(p.assigned_to))
        ))
    );

CREATE POLICY "Users can create comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Notificaciones: usuarios solo ven sus propias notificaciones
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Log de actividad: usuarios pueden ver actividad de sus proyectos
CREATE POLICY "Users can view activity in their projects" ON activity_log
    FOR SELECT USING (
        entity_type = 'project' AND EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = activity_log.entity_id::UUID 
            AND (p.created_by = auth.uid() OR auth.uid() = ANY(p.assigned_to))
        )
    );

COMMIT;