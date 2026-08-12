# Registro de Cambios (CHANGELOG.md)

Todos los cambios notables en el proyecto **Intranet Escolar** se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/), y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.0.0] - 2026-08-12

### Añadido (Added)
- **Motor SQLite WebAssembly (`sql.js`):** Integración de motor de base de datos relacional ejecutado en el navegador con soporte para WebAssembly.
- **Persistencia en IndexedDB:** Auto-guardado de la base de datos `.sqlite` en IndexedDB para conservar datos tras recargar la página.
- **Autenticación y RBAC Client-Side:** Sistema de autenticación local con hashing Web Crypto SHA-256 y control de accesos basado en tres roles (`administracion`, `docente`, `estudiante_familia`).
- **Diseño Institucional Escolar:** Paleta sobria institucional basada en `shadcn/ui` y Tailwind CSS con header fijo, sidebar filtrado y tarjetas de métricas.
- **Módulo de Usuarios (Solo Administración):** Pantalla de gestión de usuarios con tabla interactiva, modales `Dialog` para alta/edición y vinculación de perfiles de familias con estudiantes.
- **Módulo Académico de Calificaciones:** Registro y edición de notas por asignatura/trimestre con observaciones docentes y vista de boletín filtrado para perfiles familiares.
- **Control de Asistencia:** Pase de lista diario con indicadores de puntualidad, justificaciones médicas y tasa de asistencia.
- **Tablón de Comunicados:** Sistema de avisos institucionales categorizados (General, Académico, Urgente, Evento) con soporte para fijar anuncios destacados.
- **Herramienta de Administración de BD:** Exportación directa del archivo binario `.sqlite` y función de reinicio a datos de prueba (seed).
- **Documentación Completa:** Inclusión de `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `docs/arquitectura.md`, `docs/requerimientos.md` y `AGENTS.md`.
