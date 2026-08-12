# AGENTS.md — Memoria del Agente IA

Este archivo contiene la memoria estructurada y las directrices operativas para los agentes de inteligencia artificial y desarrolladores que trabajen en el proyecto **Intranet Escolar — Instituto Educativo San Martín**.

---

## 1. Contexto

- **Nombre del Proyecto:** Intranet Escolar (Instituto Educativo San Martín).
- **Propósito:** Prototipo educativo y funcional de intranet para una escuela pública que centraliza la comunicación institucional, el registro de calificaciones y el control de asistencia.
- **Stack Tecnológico:**
  - **Frontend:** React (Vite), componentes funcionales, Hooks (`useState`, `useEffect`, `useContext`).
  - **UI System:** `shadcn/ui` sobre Tailwind CSS (Button, Card, Table, Dialog, Tabs, Badge, Input, Select, Alert).
  - **Base de Datos:** SQLite ejecutado en WebAssembly mediante `sql.js`.
  - **Persistencia:** Binary store en `IndexedDB` para guardar la imagen del archivo `.sqlite`.
  - **Backend:** **NINGUNO.** Toda la lógica de negocio, autenticación e inspección SQL corre en el navegador del cliente.
- **Tipos de Usuario:** `administracion`, `docente`, `estudiante_familia`.

---

## 2. Requerimientos

- Autenticación por roles en cliente con hashing SHA-256 de contraseñas.
- CRUD completo de usuarios asignable por el rol de administración.
- Módulo académico para ingresar/consultar notas y asistencia por curso y estudiante.
- Tablón de comunicados institucionales con avisos fijados y categorización.
- Herramienta para inspeccionar la base de datos y descargar el archivo binario `.sqlite`.
- *(Consulte el detalle completo en [`docs/requerimientos.md`](file:///c:/Users/eduar/Desktop/fwd/intranet-school/docs/requerimientos.md))*

---

## 3. Reglas de Desarrollo

- **Componentes React:** Usar exclusivamente componentes funcionales con Hooks. No usar componentes de clase.
- **Nombres y Convenciones:** Nombres de variables y funciones en código en camelCase e inglés (`currentUser`, `hashPassword`, `loadData`). Nombres de archivos de componentes en PascalCase (`Dashboard.jsx`).
- **Diseño shadcn/ui:** Reutilizar siempre los componentes definidos en `src/components/ui/` en lugar de HTML crudo.
- **Validación de Cambios:** Todo cambio en la capa de datos debe ser probado ejecutando la compilación (`npm run build`) e inspeccionando que las mutaciones persistan tras recargar (`IndexedDB`).

---

## 4. Restricciones Técnicas y de Seguridad

- ❌ **NO introducir un servidor Backend:** Está estrictamente prohibido agregar Express, NestJS o cualquier API REST remota.
- ❌ **NO guardar contraseñas en texto plano:** Todas las contraseñas deben procesarse con la función de hashing SHA-256 (`hashPassword`) antes de insertarse en la tabla `usuarios`.
- ❌ **NO exponer datos de menores entre familias:** Un usuario con rol `estudiante_familia` únicamente debe ver la información relacionada con el `estudiante_id` vinculado en su cuenta.
- ❌ **NO mezclar HTML plano con la interfaz:** Se debe mantener la consistencia estética usando la biblioteca de componentes `shadcn/ui` y Tailwind CSS.

---

## 5. Objetivos Futuros (Hitos Siguientes)

- [ ] Soporte para exportación de boletines académicos en formato PDF en cliente.
- [ ] Módulo de mensajería interna directa entre familias y tutores docentes.
- [ ] Gráficos comparativos de rendimiento académico por asignatura usando biblioteca ligera en cliente (p. ej. Recharts).

---

## 6. Memoria del Proyecto (Decisiones y Racionalidad)

- **¿Por qué `sql.js` en lugar de un servidor de BD?**
  Para cumplir con el requisito de prototipo autónomo ejecutable sin dependencias de infraestructura ni configuración de servidores locales.
- **¿Por qué `IndexedDB` para la persistencia?**
  A diferencia de `localStorage` (limitado a ~5MB de texto base64), `IndexedDB` maneja eficientemente Blobs binarios de `Uint8Array` sin degradación de rendimiento.
- **¿Por qué Web Crypto API SHA-256?**
  Utilizar la API criptográfica nativa del navegador evita incluir bibliotecas pesadas de Node.js en el cliente y garantiza velocidad inmediata.

---

## 7. Buenas Prácticas y Filosofía

- **Documentar el "por qué", no solo el "qué":** Al escribir código o documentación, priorizar la explicación de la intención arquitectónica y la seguridad sobre la mera sintaxis.
- **Transparencia sobre limitaciones:** Mantener siempre visible en la documentación que la arquitectura client-side pura es una solución prototípica y educativa.
