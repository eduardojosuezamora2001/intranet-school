# Guía de Contribución (CONTRIBUTING.md)

¡Gracias por tu interés en contribuir a la **Intranet Escolar del Instituto San Martín**! Este documento define el flujo de trabajo, la convención de ramas, el formato de commits y el proceso de revisión de código para mantener la calidad y consistencia del proyecto.

---

## 🌿 Convención de Ramas (Git Flow)

Toda contribución debe realizarse mediante ramas de trabajo derivadas de la rama principal `main`.

Las ramas deben nombrarse siguiendo el siguiente esquema:

- `feat/nombre-funcionalidad`: Para nuevas características (ej: `feat/modulo-asistencia`).
- `fix/descripcion-bug`: Para corrección de errores (ej: `fix/calculo-promedio-notas`).
- `docs/nombre-documento`: Para actualizaciones de documentación (ej: `docs/actualizar-arquitectura`).
- `refactor/componente`: Para mejoras internas de código sin cambiar comportamiento visual.

---

## 💬 Formato de Commits (Conventional Commits)

Los mensajes de commit deben ser claros, descriptivos y estar escritos en español o inglés siguiendo la norma [Conventional Commits](https://www.conventionalcommits.org/):

### Estructura:
```text
tipo(alcance): descripción breve en presente imperativo
```

### Tipos permitidos:
- `feat`: Nueva funcionalidad para el usuario final.
- `fix`: Corrección de un fallo o error en el código.
- `docs`: Cambios exclusivamente en la documentación Markdown.
- `style`: Cambios de formato o estilos CSS/Tailwind que no afectan la lógica.
- `refactor`: Reorganización de código que no corrige un bug ni añade una característica.
- `test`: Adición o modificación de pruebas.

### Ejemplos válidos:
```bash
git commit -m "feat(auth): implementar hashing SHA-256 en cliente para contraseñas"
git commit -m "fix(calificaciones): corregir filtrado estricto por alumno en rol familia"
git commit -m "docs(readme): añadir tabla de credenciales de demostración"
```

---

## 🔄 Proceso de Pull Requests (PR)

1. **Crear una rama local:**
   ```bash
   git checkout -b feat/nueva-vista-comunicados
   ```

2. **Realizar cambios y commits periódicos descriptivos:**
   ```bash
   git add .
   git commit -m "feat(comunicados): implementar fijado de avisos institucionales"
   ```

3. **Verificar compilación antes de subir:**
   ```bash
   npm run build
   ```

4. **Abrir el Pull Request:**
   - Describa los cambios realizados y los componentes modificados.
   - Adjunte capturas de pantalla si modificó la interfaz visual.
   - Asegúrese de vincular el Issue o Requerimiento correspondiente.
