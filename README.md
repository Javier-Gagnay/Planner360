# Planificador de Proyectos

Una aplicación web moderna para la gestión y planificación de proyectos con funcionalidades avanzadas de seguimiento de tareas, visualización temporal y personalización de temas.

## 🚀 Características Principales

### Gestión de Proyectos
- ✅ Creación y edición de múltiples proyectos
- ✅ Seguimiento de progreso en tiempo real
- ✅ Estadísticas detalladas por proyecto
- ✅ Navegación entre proyectos activos

### Gestión de Tareas
- ✅ Creación de tareas con subtareas anidadas
- ✅ Asignación de prioridades (Alta, Media, Baja)
- ✅ Estados de progreso personalizables
- ✅ Fechas de inicio y duración planificada/real
- ✅ Progreso dinámico automático para tareas padre

### Visualización
- ✅ **Vista de Tabla**: Lista detallada con filtros avanzados
- ✅ **Vista de Calendario**: Visualización mensual de tareas
- ✅ **Vista Híbrida**: Diagrama de Gantt interactivo
- ✅ Filtros por estado, prioridad y progreso
- ✅ Búsqueda en tiempo real

### Sistema de Temas
- ✅ Personalización completa de colores, tipografía y espaciado
- ✅ Carga de temas desde archivos JSON
- ✅ Temas predefinidos incluidos
- ✅ Vista previa antes de aplicar
- ✅ Exportación de temas personalizados
- ✅ Persistencia automática en localStorage

### Persistencia de Datos
- ✅ Guardado automático en localStorage
- ✅ Exportación de datos en formato JSON
- ✅ Recuperación automática al recargar

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Estilos**: CSS Variables, Flexbox, Grid
- **Iconos**: Font Awesome
- **Almacenamiento**: localStorage API
- **Servidor de desarrollo**: Python HTTP Server

## 📁 Estructura del Proyecto

```
Planner - Interno/
├── index.html          # Página principal
├── script.js           # Lógica de la aplicación
├── styles.css          # Estilos CSS
├── .gitignore          # Archivos excluidos del repositorio
└── README.md           # Documentación
```

## 🚀 Instalación y Uso

### Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Python 3.x (para servidor de desarrollo local)

### Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/planificador-proyectos.git
   cd planificador-proyectos
   ```

2. **Iniciar servidor local**:
   ```bash
   python -m http.server 8000
   ```

3. **Abrir en el navegador**:
   ```
   http://localhost:8000
   ```

### Uso en Producción

Para desplegar en producción, simplemente sube los archivos `index.html`, `script.js` y `styles.css` a tu servidor web. No se requiere configuración adicional.

## 📖 Guía de Uso

### Gestión de Proyectos
1. Haz clic en "Nuevo Proyecto" para crear un proyecto
2. Completa la información básica (nombre, descripción, fechas)
3. Usa el botón "Proyectos" para navegar entre proyectos activos

### Gestión de Tareas
1. Haz clic en "Nueva Tarea" para agregar tareas al proyecto actual
2. Define prioridad, fechas y duración
3. Crea subtareas usando el campo "Tarea Padre"
4. Actualiza el progreso usando la barra deslizante

### Personalización de Temas
1. Accede a "Configuración" → "Gestión de Temas"
2. Carga un archivo JSON con tu tema personalizado
3. Usa la vista previa para verificar los cambios
4. Aplica el tema o exporta el actual

### Formato de Archivo de Tema

```json
{
  "name": "Mi Tema Personalizado",
  "colors": {
    "primary": "#2196f3",
    "secondary": "#f44336",
    "background": "#ffffff",
    "text": "#333333"
  },
  "typography": {
    "font-family": "Arial, sans-serif",
    "font-size-base": "14px"
  },
  "spacing": {
    "padding-small": "8px",
    "margin-medium": "16px"
  },
  "borders": {
    "radius-medium": "8px",
    "width-thin": "1px"
  }
}
```

## 🔧 Desarrollo

### Estructura del Código

- **ProjectManager**: Clase principal que maneja toda la lógica de proyectos y tareas
- **Funciones de Tema**: Sistema modular para personalización visual
- **Event Listeners**: Gestión centralizada de eventos de UI
- **Persistencia**: Manejo automático de localStorage

### Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Soporte

Si encuentras algún problema o tienes sugerencias, por favor:
1. Revisa los issues existentes
2. Crea un nuevo issue con detalles del problema
3. Incluye pasos para reproducir el error

## 🎯 Roadmap

- [ ] Integración con APIs externas
- [ ] Notificaciones push
- [ ] Colaboración en tiempo real
- [ ] Aplicación móvil
- [ ] Exportación a PDF
- [ ] Integración con calendarios externos

---

**Desarrollado con ❤️ para mejorar la productividad en la gestión de proyectos**