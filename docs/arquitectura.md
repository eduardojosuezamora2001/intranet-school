# Arquitectura del Sistema (docs/arquitectura.md)

## 📌 Visión General de la Arquitectura

La **Intranet Escolar del Instituto Educativo San Martín** ha sido diseñada como una **Single Page Application (SPA) Client-Side Autónoma**, lo que significa que el 100% de la lógica de presentación, la lógica de negocio, las reglas de autenticación, el control de acceso por roles (RBAC) y el almacenamiento persistente de datos se ejecutan de forma nativa en el navegador del usuario final.

```
+-----------------------------------------------------------------------------------+
|                                 NAVEGADOR DEL USUARIO                             |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                     Capa de Presentación (React SPA)                        |  |
|  |    Componentes shadcn/ui (Button, Card, Table, Dialog, Badge, Tabs, Alert)   |  |
|  +-----------------------------------+-----------------------------------------+  |
|                                      |                                            |
|                                      v                                            |
|  +-----------------------------------------------------------------------------+  |
|  |                      Capa de Negocio y Seguridad (Context)                  |  |
|  |           AuthContext (RBAC: administracion | docente | familia)            |  |
|  +-----------------------------------+-----------------------------------------+  |
|                                      |                                            |
|                                      v                                            |
|  +-----------------------------------------------------------------------------+  |
|  |                    Capa de Datos Local (sql.js / WebAssembly)                |  |
|  |             Motor SQLite de 32-bit compilado a WASM en memoria              |  |
|  +-----------------------------------+-----------------------------------------+  |
|                                      |                                            |
|                                      v  (Export Uint8Array Blob)                   |
|  +-----------------------------------------------------------------------------+  |
|  |                  Capa de Persistencia Nativa (IndexedDB)                    |  |
|  |           Store binario local 'sqlite_db_file' en navegador cliente          |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 🛠️ Stack Tecnológico Seleccionado

| Capa | Tecnología | Justificación Técnica |
|---|---|---|
| **Frontend Core** | React 18 + Vite | Componentes funcionales, estado reactivo mediante Hooks y empaquetado ultra-rápido en desarrollo/producción. |
| **UI System** | shadcn/ui + Tailwind CSS | Componentes de interfaz accesibles y modulares con paleta institucional sobria (Azul marino / Verde bosque / Neutros). |
| **Motor de BD** | `sql.js` (SQLite en WebAssembly) | Permite ejecutar un motor relacional SQL completo dentro del hilo principal del navegador sin necesidad de servidores externos. |
| **Persistencia** | IndexedDB Nativo | API de almacenamiento binario del navegador para almacenar la imagen Uint8Array del archivo `.sqlite` y conservar los datos al reiniciar la pestaña. |
| **Criptografía** | Web Crypto API (`crypto.subtle`) | Hashing seguro SHA-256 para contraseñas de usuarios almacenadas en la tabla `usuarios`. |

---

## 📁 Estructura Jerárquica de Archivos

- `public/sql-wasm.wasm`: Binario compilado C->WASM cargado asíncronamente por `sql.js`.
- `src/services/db.js`: Abstracción de conexión SQLite, scripts DDL, funciones de consulta `query()` / `run()`, y auto-guardado en IndexedDB.
- `src/context/AuthContext.jsx`: Estado global de autenticación, validación de credenciales con SHA-256, y guardias de rol.
- `src/components/ui/`: Biblioteca de componentes reutilizables adaptados de shadcn/ui.
- `src/pages/`: Módulos funcionales de la aplicación (`Login`, `Dashboard`, `Usuarios`, `Calificaciones`, `Asistencia`, `Comunicados`, `BaseDatos`).

---

## ⚠️ NOTA DE TRANSPARENCIA Y LIMITACIONES DEL PROTOTIPO SIN BACKEND

> [!CAUTION]
> **Aviso Importante sobre Seguridad y Producción:**
> Este proyecto es un **prototipo educativo y demostrativo de arquitectura Client-Side pura**.
> 
> Debido a que la base de datos SQLite y la lógica de autenticación residen enteramente dentro de la memoria del navegador del cliente:
> 1. **No existe aislamiento de seguridad en red:** Un usuario avanzado con acceso a las herramientas de desarrollo del navegador (DevTools) puede inspeccionar las tablas SQLite en memoria.
> 2. **Persistencia local por dispositivo:** Los datos guardados en IndexedDB son locales para el navegador y equipo en el que se ejecuta la aplicación.
> 
> **En un entorno de producción real**, la autenticación, la verificación de permisos por rol, el cifrado de datos sensibles de menores y la base de datos relacional **deben residir obligatoriamente detrás de un servidor Backend seguro** (p. ej. Node.js, Express, PostgreSQL/SQLite en servidor) protegido con HTTPS y tokens de sesión firmados (JWT/OAuth2).
