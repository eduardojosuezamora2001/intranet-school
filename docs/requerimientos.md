# Requerimientos del Sistema (docs/requerimientos.md)

Este documento detalla la lista de verificación de los requerimientos funcionales y no funcionales aprobados para el prototipo de la **Intranet Escolar del Instituto Educativo San Martín**.

---

## 📋 Requerimientos Funcionales

- [x] **Autenticación por Roles:** Pantalla de inicio de sesión sobria e institucional con soporte para roles `administracion`, `docente` y `estudiante_familia`, incluyendo cierre de sesión y atajos de demostración.
- [x] **Gestión de Usuarios (Administración):** Módulo accesible exclusivamente por el rol de Administración para dar de alta, modificar y eliminar personas, asignando roles y vinculando cuentas familiares a estudiantes.
- [x] **Módulo Académico de Calificaciones:** Registro y edición de notas con observaciones cualitativas por docentes, y vista de boletín oficial filtrada estrictamente para el estudiante correspondiente al rol de familia.
- [x] **Control de Asistencia:** Sistema de pase de lista diario con estados (`Presente`, `Ausente`, `Tardanza`, `Justificado`), visualización de observaciones y porcentaje global de puntualidad.
- [x] **Tablón de Comunicados:** Creación (Administración / Docentes) y consulta (Todos los roles) de avisos oficiales institucionales con categorización (`General`, `Académico`, `Urgente`, `Evento`) y soporte para anuncios fijados.
- [x] **Vistas Condicionadas por Rol (RBAC):** Restricción de navegación y componentes según el rol activo (p. ej. las familias solo ven la información de su propio estudiante asignado).
- [x] **Administración y Respaldo de Base de Datos:** Panel para inspección de tablas relacionales en caliente, descarga del archivo físico binario `.sqlite` y función de reinicio de datos de prueba.

---

## ⚙️ Requerimientos No Funcionales

- [x] **Interfaz Clara y Accesible:** Contraste de color optimizado, etiquetas formales en todos los formularios, soporte para navegación por teclado e indicadores visuales de estado.
- [x] **Protección de Datos Sensibles:** Filtrado estricto en cliente para garantizar que la información personal y calificaciones de alumnos menores de edad no se expongan entre familias.
- [x] **Arquitectura Client-Side Autónoma:** Base de datos SQLite ejecutada completamente en el navegador con `sql.js` (WebAssembly) e `IndexedDB` para almacenamiento persistente sin requerir servidor backend.
- [x] **Diseño Escolar Elegante e Institucional:** Interfaz estructurada basada en componentes de `shadcn/ui` y Tailwind CSS, con paleta de tonos azul marino/slate/indigo y tipografía sans-serif limpia (`Inter`).
- [x] **Control de Versiones Git:** Repositorio estructurado desde el primer commit con mensajes descriptivos siguiendo el estándar Conventional Commits.
- [x] **Documentación Exhaustiva en Markdown:** Creación y mantenimiento de `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `docs/arquitectura.md`, `docs/requerimientos.md` y `AGENTS.md`.
