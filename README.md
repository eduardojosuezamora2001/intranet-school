# Intranet Escolar — Instituto Educativo San Martín

![Licencia](https://img.shields.io/badge/licencia-MIT-blue.svg)
![Stack](https://img.shields.io/badge/stack-React_%7C_Vite_%7C_SQLite_WASM-indigo.svg)
![Backend](https://img.shields.io/badge/backend-Ninguno_(Client--Side)-emerald.svg)

Prototipo completo y funcional de **Intranet para Colegio / Escuela Pública**, desarrollado con React (Vite), Tailwind CSS, componentes basados en [shadcn/ui](https://ui.shadcn.com) y motor de base de datos **SQLite ejecutado enteramente en el navegador mediante WebAssembly (`sql.js`)** con auto-guardado en **IndexedDB**.

---

## 🌟 Características Principales

- 🔐 **Autenticación por Roles en Cliente:** Control de accesos RBAC para tres tipos de usuario (`administracion`, `docente`, `estudiante_familia`).
- ⚡ **Sin Servidor (Client-Side Pura):** No requiere ningún backend activo. La base de datos corre en memoria WASM y persiste en el almacenamiento local del navegador (`IndexedDB`).
- 👥 **Gestión de Usuarios (Solo Administración):** Alta, modificación, asignación de roles y vinculación de perfiles familiares a alumnos.
- 🎓 **Módulo Académico de Calificaciones:** Registro y edición de notas con retroalimentación cualitativa (docentes) y consulta filtrada por alumno (familias).
- 📅 **Control de Asistencia:** Pase de lista diario con indicadores de puntualidad, faltas justificadas y porcentajes generales.
- 📢 **Tablón de Comunicados:** Publicación de avisos oficiales institucionales con categorización (General, Académico, Urgente, Evento) y avisos fijados al inicio.
- 💾 **Exportación y Respaldo SQLite:** Posibilidad de descargar en cualquier momento el archivo físico binario `.sqlite` generado en caliente.

---

## 🔑 Credenciales de Demostración (Seed Data)

El sistema se inicia automáticamente con datos de prueba sembrados en SQLite:

| Rol | Usuario | Contraseña | Alumno Vinculado / Descripción |
|---|---|---|---|
| **Administración** | `admin` | `admin123` | Control total del sistema y gestión de usuarios |
| **Docente** | `profesor.garcia` | `docente123` | Profesor Javier García (Profesor de 4º Primaria) |
| **Estudiante / Familia** | `familia.perez` | `familia123` | Tutor de Mateo Pérez (4º Primaria A) |
| **Estudiante / Familia** | `familia.gomez` | `familia123` | Tutor de Sofia Gómez (4º Primaria A) |

> 💡 **Tip:** En la pantalla de Login encontrará botones de **acceso rápido de 1-clic** para ingresar con cualquiera de estas cuentas sin escribir.

---

## 🚀 Instalación y Ejecución Local

### Requisitos Previos

- **Node.js** (v18.0.0 o superior)
- **npm** (v9.0.0 o superior)
- Navegador web moderno con soporte WebAssembly e IndexedDB (Chrome, Firefox, Edge, Safari).

### Pasos de Instalación

1. **Clonar el repositorio o situarse en la carpeta raíz:**
   ```bash
   cd intranet-school
   ```

2. **Instalar las dependencias del proyecto:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo Vite:**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador:**
   Navegar a `http://localhost:5173` (o el puerto indicado por Vite).

---

## 📁 Estructura del Proyecto

```
intranet-school/
├── docs/
│   ├── arquitectura.md     # Decisiones de diseño, diagrama y nota sobre sin-backend
│   └── requerimientos.md   # Lista de verificación de requerimientos (Tasks)
├── public/
│   └── sql-wasm.wasm       # Binario WebAssembly de SQLite
├── src/
│   ├── components/
│   │   ├── layout/         # Header y Sidebar institucional
│   │   └── ui/             # Componentes reutilizables shadcn/ui (Button, Card, Table, Dialog, Badge, Tabs, Input, Alert)
│   ├── context/
│   │   └── AuthContext.jsx # Proveedor de contexto React & RBAC client-side
│   ├── pages/
│   │   ├── Login.jsx       # Acceso institucional con atajos de rol
│   │   ├── Dashboard.jsx   # Métricas e información personalizada por rol
│   │   ├── Usuarios.jsx    # CRUD de usuarios (Administración)
│   │   ├── Calificaciones.jsx # Gestión y boletín de notas
│   │   ├── Asistencia.jsx  # Pase de lista diario
│   │   ├── Comunicados.jsx # Tablón de anuncios con fijados
│   │   └── BaseDatos.jsx   # Inspección y exportación SQLite
│   ├── services/
│   │   └── db.js           # Capa de datos sql.js + IndexedDB + SHA-256
│   ├── App.jsx             # Enrutador y layout principal
│   └── index.css           # Sistema de diseño Tailwind CSS
├── AGENTS.md               # Memoria del Agente IA (7 secciones)
├── CHANGELOG.md            # Registro de versiones (Keep a Changelog)
├── CONTRIBUTING.md         # Guía de contribución y flujo Git
└── package.json
```

---

## 📝 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulte el archivo `LICENSE` para más detalles. Prototipo desarrollado para fines educativos e institucionales.
