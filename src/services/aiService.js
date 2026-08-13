import { query } from './db';

const PAGE_NAMES = {
  dashboard: 'Panel Principal (Dashboard)',
  comunicados: 'Tablón de Comunicados',
  calificaciones: 'Registro de Calificaciones',
  asistencia: 'Control de Asistencia',
  usuarios: 'Gestión de Usuarios',
  base_datos: 'Inspección de Base de Datos'
};

/**
 * Intelligent & Automated Context-Aware AI Engine for Instituto Educativo San Martín
 * Resolves queries dynamically based on live SQLite data, page state, user profile, and NLP intents.
 */
export async function getAIResponse(userMessage, currentUser, studentInfo, currentTab = 'dashboard') {
  const rawText = userMessage.trim();
  const text = rawText.toLowerCase();

  // Simulated AI response latency for natural feeling
  await new Promise((resolve) => setTimeout(resolve, 450 + Math.random() * 300));

  const role = currentUser?.rol || 'estudiante_familia';
  const userName = currentUser?.nombre || 'Estimado Usuario';
  const studentId = currentUser?.estudiante_id;
  const activePage = PAGE_NAMES[currentTab] || 'Sección Actual';

  // ------------------------------------------------------------------
  // 1. SALUDOS Y PRESENTACIÓN
  // ------------------------------------------------------------------
  if (/^(hola|buenas|buenos|saludos|que tal|qué tal|hola!|buenas!)/i.test(text)) {
    return `¡Hola, **${userName}**! 👋 Soy **San Martín IA**, tu asistente virtual para la intranet escolar.\n\n` +
      `Actualmente estás explorando la pestaña: **${activePage}**.\n\n` +
      `**¿En qué puedo ayudarte en este momento?**\n` +
      `• *Consultar notas o boletines académicos*\n` +
      `• *Revisar el registro de asistencia o inasistencias*\n` +
      `• *Leer avisos y comunicados oficiales*\n` +
      `• *Saber qué funciones realizar en la página actual*`;
  }

  // ------------------------------------------------------------------
  // 2. PREGUNTAS SOBRE LA PÁGINA ACTUAL / "QUÉ PUEDO HACER AQUÍ"
  // ------------------------------------------------------------------
  if (
    text.includes('esta pagina') || 
    text.includes('esta página') || 
    text.includes('que hago aqui') || 
    text.includes('qué hago aquí') || 
    text.includes('donde estoy') || 
    text.includes('dónde estoy') ||
    text.includes('para que sirve') ||
    text.includes('para qué sirve') ||
    text.includes('explicacion') ||
    text.includes('explicación') ||
    text.includes('que hay aqui') ||
    text.includes('qué hay aquí')
  ) {
    return getPageExplanation(currentTab, role, userName, studentInfo);
  }

  // ------------------------------------------------------------------
  // 3. CALIFICACIONES / NOTAS / MATERIAS / PROMEDIOS
  // ------------------------------------------------------------------
  if (
    text.includes('nota') || 
    text.includes('calificac') || 
    text.includes('promedio') || 
    text.includes('rendimiento') || 
    text.includes('boletin') || 
    text.includes('boletín') || 
    text.includes('materia') || 
    text.includes('asignatura') ||
    text.includes('examen') ||
    text.includes('evaluacion') ||
    text.includes('evaluación')
  ) {
    if (role === 'estudiante_familia') {
      if (!studentId) {
        return `📌 **Hola ${userName}** (Pestaña actual: *${activePage}*)\n\n` +
          `No se encontró un estudiante vinculado a tu cuenta en la base de datos local para consultar calificaciones. ` +
          `Por favor ponte en contacto con la Dirección o la Administración del colegio para enlazar tu perfil.`;
      }

      const grades = query(
        `SELECT asignatura, trimestre, nota, observacion, docente_nombre 
         FROM calificaciones 
         WHERE estudiante_id = ? 
         ORDER BY trimestre ASC, asignatura ASC`,
        [studentId]
      );

      if (grades.length === 0) {
        return `📊 **Calificaciones de ${studentInfo?.nombre || 'tu estudiante'}**\n\n` +
          `Hola **${userName}**, por el momento no hay calificaciones cargadas en el sistema para este período. ` +
          `Te sugerimos revisar nuevamente más adelante o consultar en la pestaña **Calificaciones**.`;
      }

      const avg = (grades.reduce((acc, g) => acc + g.nota, 0) / grades.length).toFixed(1);
      const studentName = studentInfo?.nombre || 'tu estudiante';

      let response = `📊 **Boletín Académico para ${studentName}** (Consulta realizada por: *${userName}*)\n\n`;
      response += `• **Promedio acumulado**: **${avg}** / 10.0\n`;
      response += `• **Grado y Sección**: ${studentInfo?.curso || 'Primaria'} - ${studentInfo?.seccion || 'A'}\n\n`;
      response += `**Calificaciones Registradas**:\n`;

      grades.forEach((g) => {
        const badge = g.nota >= 9 ? '🌟 Sobresaliente' : g.nota >= 7 ? '👍 Notable' : g.nota >= 5 ? '✅ Aprobado' : '⚠️ Insuficiente';
        response += `• **${g.asignatura}** (${g.trimestre}): **${g.nota}** (${badge})\n  *Observación del docente*: "${g.observacion}" — _${g.docente_nombre}_\n\n`;
      });

      return response;
    } else if (role === 'docente') {
      const gradesCount = query(`SELECT COUNT(*) as total FROM calificaciones`)[0]?.total || 0;
      const recent = query(
        `SELECT e.nombre as estudiante, c.asignatura, c.nota, c.trimestre 
         FROM calificaciones c 
         JOIN estudiantes e ON c.estudiante_id = e.id 
         ORDER BY c.id DESC LIMIT 4`
      );

      let resp = `👨‍🏫 **Gestión Docente de Calificaciones (${userName})**\n\n`;
      resp += `Actualmente hay **${gradesCount}** notas asentadas en el registro global.\n\n`;
      resp += `**Últimas notas registradas**:\n`;
      recent.forEach(g => {
        resp += `• **${g.estudiante}** | ${g.asignatura} (${g.trimestre}): **${g.nota}**\n`;
      });
      resp += `\n**Instrucciones**: Para añadir o modificar una calificación, ve a la pestaña **Calificaciones**, selecciona el estudiante e ingresa el valor deseado.`;
      return resp;
    } else {
      const count = query(`SELECT COUNT(*) as total FROM calificaciones`)[0]?.total || 0;
      const top = query(`SELECT asignatura, AVG(nota) as prom FROM calificaciones GROUP BY asignatura ORDER BY prom DESC`);
      let summary = top.map(t => `• ${t.asignatura}: Promedio **${t.prom.toFixed(1)}**`).join('\n');
      return `🏛️ **Administración - Auditoría de Calificaciones**\n\nEstimado **${userName}**, existen **${count}** notas registradas en SQLite.\n\n**Promedios por Materia**:\n${summary}\n\nPuedes consultar o exportar todos los datos desde el panel de la Intranet.`;
    }
  }

  // ------------------------------------------------------------------
  // 4. ASISTENCIA / FALTAS / TARDANZAS
  // ------------------------------------------------------------------
  if (
    text.includes('asistencia') || 
    text.includes('falta') || 
    text.includes('tardanza') || 
    text.includes('ausente') || 
    text.includes('presente') || 
    text.includes('justific')
  ) {
    if (role === 'estudiante_familia') {
      if (!studentId) return `Hola **${userName}**, no se encontró un expediente de estudiante asociado a tu usuario.`;

      const records = query(
        `SELECT fecha, estado, observacion FROM asistencia WHERE estudiante_id = ? ORDER BY fecha DESC LIMIT 7`,
        [studentId]
      );

      if (records.length === 0) {
        return `📅 **Control de Asistencia**: Hola **${userName}**, no hay registros de inasistencias o tardanzas para ${studentInfo?.nombre || 'tu estudiante'}. ¡Su asistencia es del 100%!`;
      }

      let presentes = 0, ausentes = 0, tardanzas = 0, justificados = 0;
      records.forEach(r => {
        if (r.estado === 'Presente') presentes++;
        else if (r.estado === 'Ausente') ausentes++;
        else if (r.estado === 'Tardanza') tardanzas++;
        else if (r.estado === 'Justificado') justificados++;
      });

      let resp = `📋 **Récord de Asistencia de ${studentInfo?.nombre || 'tu estudiante'}** (Consulta para *${userName}*)\n\n`;
      resp += `• **Presente**: ${presentes} día(s) | **Tardanza**: ${tardanzas} | **Ausente**: ${ausentes} | **Justificado**: ${justificados}\n\n`;
      resp += `**Detalle por Fecha**:\n`;
      records.forEach(r => {
        const icon = r.estado === 'Presente' ? '✅' : r.estado === 'Tardanza' ? '⏰' : r.estado === 'Justificado' ? '📝' : '❌';
        resp += `• **${r.fecha}**: ${icon} **${r.estado}** ${r.observacion ? `— _${r.observacion}_` : ''}\n`;
      });

      resp += `\n💡 *Para justificar una ausencia*: Envía la constancia al tutor a la dirección de correo: \`${studentInfo?.tutor_email || 'tutor@sanmartin.edu.es'}\`.`;
      return resp;
    } else {
      const stats = query(`SELECT estado, COUNT(*) as count FROM asistencia GROUP BY estado`);
      let summary = stats.map(s => `• **${s.estado}**: ${s.count} registro(s)`).join('\n');
      return `📅 **Reporte General de Asistencia - San Martín**\n\nEstimado/a **${userName}**, el estado actual de la asistencia en el colegio es:\n${summary}\n\nPuedes pasar lista o modificar asistencias desde la pestaña **Asistencia**.`;
    }
  }

  // ------------------------------------------------------------------
  // 5. COMUNICADOS / ANUNCIOS / NOTICIAS
  // ------------------------------------------------------------------
  if (
    text.includes('comunicado') || 
    text.includes('anuncio') || 
    text.includes('aviso') || 
    text.includes('noticia') || 
    text.includes('circular') || 
    text.includes('publicac')
  ) {
    const list = query(`SELECT titulo, contenido, categoria, destinatarios, autor_nombre, fecha, fijado FROM comunicados ORDER BY fijado DESC, id DESC LIMIT 4`);
    
    let resp = `📢 **Tablón de Comunicados (San Martín IA)**\n\nHola **${userName}**, aquí tienes las novedades institucionales recientes:\n\n`;
    list.forEach(c => {
      const tag = c.fijado ? '📌 [IMPORTANTE]' : '🔹';
      resp += `${tag} **${c.titulo}** (${c.categoria})\n`;
      resp += `   *Destinado a*: ${c.destinatarios} | *Por*: ${c.autor_nombre} (${c.fecha.slice(0, 10)})\n`;
      resp += `   "${c.contenido.slice(0, 120)}${c.contenido.length > 120 ? '...' : ''}"\n\n`;
    });

    resp += `Para leer los comunicados completos, dirígete al menú **Comunicados** en el lateral izquierdo.`;
    return resp;
  }

  // ------------------------------------------------------------------
  // 6. USUARIOS / CUENTAS / PERFILES / CONTRASEÑAS
  // ------------------------------------------------------------------
  if (
    text.includes('usuario') || 
    text.includes('rol') || 
    text.includes('cuenta') || 
    text.includes('contraseña') || 
    text.includes('clave') || 
    text.includes('perfil') ||
    text.includes('login')
  ) {
    let resp = `👤 **Información de Cuenta de ${userName}**\n\n`;
    resp += `• **Nombre de Usuario**: \`${currentUser?.username}\`\n`;
    resp += `• **Rol**: **${role}**\n`;
    resp += `• **Protección de Datos**: Contraseña cifrada con algoritmo SHA-256 (Web Crypto API).\n\n`;

    if (role === 'administracion') {
      const usersCount = query(`SELECT COUNT(*) as t FROM usuarios`)[0]?.t || 0;
      resp += `👑 **Acceso Admin**: Como administrador, puedes gestionar las **${usersCount}** cuentas del sistema desde la sección **Usuarios**.`;
    } else {
      resp += ` Si requieres asistencia con el cambio de clave o actualización de datos, contacta a la secretaría del colegio.`;
    }
    return resp;
  }

  // ------------------------------------------------------------------
  // 7. BASE DE DATOS / SQLITE / TECNOLOGÍA
  // ------------------------------------------------------------------
  if (
    text.includes('database') || 
    text.includes('base de datos') || 
    text.includes('sqlite') || 
    text.includes('indexeddb') || 
    text.includes('export') || 
    text.includes('wasm') ||
    text.includes('tecnolog')
  ) {
    return `💾 **Arquitectura Técnica de la Intranet**\n\n` +
      `Hola **${userName}**, la plataforma funciona con una arquitectura **100% Client-Side**:\n` +
      `• **Motor**: SQLite compilado en WebAssembly via \`sql.js\`.\n` +
      `• **Persistencia**: Almacenamiento local IndexedDB sin servidores backend.\n` +
      `• **Exportación**: Puedes descargar el archivo binario \`.sqlite\` en cualquier momento desde la pestaña **Base de Datos**.`;
  }

  // ------------------------------------------------------------------
  // 8. INFORMACIÓN INSTITUCIONAL / HORARIOS / CONTACTO
  // ------------------------------------------------------------------
  if (
    text.includes('horario') || 
    text.includes('contacto') || 
    text.includes('telefono') || 
    text.includes('teléfono') || 
    text.includes('correo') || 
    text.includes('mail') || 
    text.includes('direccion') || 
    text.includes('dirección') ||
    text.includes('tutor') ||
    text.includes('reunion') ||
    text.includes('reunión')
  ) {
    return `🏫 **Información Institucional del Instituto San Martín**\n\n` +
      `Estimado/a **${userName}**, aquí tienes la información del centro:\n` +
      `• **Horario de clases**: Lunes a Viernes de 08:30 h a 14:00 h.\n` +
      `• **Atención de Dirección**: \`admin@sanmartin.edu.es\`\n` +
      `• **Tutorías a Familias**: Martes y Jueves (15:30 h - 17:00 h, cita previa).\n` +
      `• **Correo Tutor**: \`${studentInfo?.tutor_email || 'javier.garcia@sanmartin.edu.es'}\``;
  }

  // ------------------------------------------------------------------
  // 9. AGRADECIMIENTOS / DESPEDIDAS
  // ------------------------------------------------------------------
  if (
    text.includes('gracias') || 
    text.includes('muchas gracias') || 
    text.includes('excelente') || 
    text.includes('genial') || 
    text.includes('perfecto') || 
    text.includes('chao') || 
    text.includes('adios') || 
    text.includes('adiós')
  ) {
    return `¡Es un placer ayudarte, **${userName}**! 😊\n\nQuedo atento si necesitas consultar cualquier otra información sobre tus materias, la asistencia o la intranet del colegio. ¡Que tengas un excelente día!`;
  }

  // ------------------------------------------------------------------
  // 10. CONSULTAS FUERA DE CONTEXTO (DEPORTES, RECETAS, JUEGOS, ETC.)
  // ------------------------------------------------------------------
  if (
    text.includes('receta') || text.includes('cocina') || text.includes('comida') ||
    text.includes('futbol') || text.includes('fútbol') || text.includes('deporte') ||
    text.includes('pelicula') || text.includes('película') || text.includes('cine') ||
    text.includes('juego') || text.includes('musica') || text.includes('música') ||
    text.includes('clima') || text.includes('tiempo')
  ) {
    return `🤖 **Asistente Virtual San Martín IA**\n\n` +
      `Hola **${userName}**, como asistente virtual del Instituto Educativo San Martín, mi función principal es ayudarte en todo lo relacionado con tu vida escolar (calificaciones, asistencias, avisos institucionales y uso de esta plataforma en la sección **${activePage}**).\n\n` +
      `Si tienes alguna pregunta sobre el colegio o tus asignaturas, ¡estoy listo para responderte!`;
  }

  // ------------------------------------------------------------------
  // 11. RESPUESTA AUTOMATIZADA GENERAL (COMPLETA Y PERSONALIZADA)
  // ------------------------------------------------------------------
  return `📌 **Asistente San Martín IA (Respuesta para ${userName})**\n\n` +
    `Entiendo tu consulta sobre *"**${rawText}**"*. Como estás navegando en la sección **${activePage}**, puedo brindarte las siguientes respuestas y opciones automáticas:\n\n` +
    `• **Si deseas revisar tus notas**: Escribe *"ver calificaciones"* o *"promedio"*.\n` +
    `• **Si deseas revisar la asistencia**: Escribe *"asistencia"* o *"inasistencias"*.\n` +
    `• **Si deseas ver anuncios oficiales**: Escribe *"comunicados"* o *"avisos"*.\n` +
    `• **Si deseas saber qué hacer en esta vista**: Escribe *"explicar esta página"*.\n\n` +
    `¿Sobre cuál de estos temas deseas que profundice, **${userName}**?`;
}

/**
 * Returns automated explanation tailored to the currently active page and user profile
 */
function getPageExplanation(tab, role, userName, studentInfo) {
  switch (tab) {
    case 'dashboard':
      return `📊 **Guía del Panel Principal (Dashboard)**\n\n` +
        `Hola **${userName}**, en esta pantalla puedes observar el resumen general del colegio:\n` +
        `• **Métricas en tiempo real**: Número de estudiantes, calificaciones, porcentaje de asistencia y avisos.\n` +
        `• **Accesos directos**: Noticias destacadas e información del perfil activo.\n` +
        `• **Base de Datos**: Confirmación de la carga de SQLite (WASM).`;

    case 'comunicados':
      return `📢 **Guía del Tablón de Comunicados**\n\n` +
        `Estimado/a **${userName}**, esta pantalla contiene los anuncios y circulares institucionales:\n` +
        `• **Categorías**: General, Académico, Urgente y Eventos.\n` +
        `• **Destinatarios**: Avisos dirigidos a Todos, solo Docentes o solo Familias.\n` +
        `${(role === 'administracion' || role === 'docente') ? '• **Acción Docente/Admin**: Puedes hacer clic en "Nuevo Comunicado" para redactar una aviso o fijar los importantes arriba.' : '• **Acción Familiar**: Consulta periódicamente para estar al tanto de excursiones y reuniones.'}`;

    case 'calificaciones':
      return `📝 **Guía del Registro de Calificaciones**\n\n` +
        `Hola **${userName}**, este módulo gestiona la evaluación académica:\n` +
        `${role === 'estudiante_familia' 
          ? `• **Vista de Alumno**: Muestra las notas y comentarios docentes asignados a **${studentInfo?.nombre || 'tu estudiante'}**.` 
          : '• **Acción Docente/Admin**: Permite filtrar alumnos por curso e ingresar/modificar calificaciones con observaciones pedagógicas.'}`;

    case 'asistencia':
      return `📅 **Guía del Control de Asistencia**\n\n` +
        `Estimado/a **${userName}**, en esta sección se supervisa la presencialidad:\n` +
        `• **Estados**: Presente (✅), Tardanza (⏰), Ausente (❌) y Justificado (📝).\n` +
        `${role === 'estudiante_familia'
          ? `• **Vista de Alumno**: Puedes verificar el historial de asistencia de **${studentInfo?.nombre || 'tu estudiante'}**.`
          : '• **Toma de Asistencia**: Los docentes pueden seleccionar la fecha y marcar la asistencia de cada estudiante.'}`;

    case 'usuarios':
      return `👤 **Guía de la Gestión de Usuarios**\n\n` +
        `Hola **${userName}**, esta pantalla administra el acceso al sistema:\n` +
        `• **Roles Disponibles**: Administración, Docente y Estudiante/Familia.\n` +
        `• **Seguridad**: Todas las contraseñas se almacenan con hash criptográfico SHA-256.\n` +
        `${role === 'administracion' ? '• **Admin**: Puedes crear nuevos usuarios o editar sus permisos.' : '• **Consulta**: Muestra la lista de cuentas autorizadas en el colegio.'}`;

    case 'base_datos':
      return `💾 **Guía de Inspección de Base de Datos**\n\n` +
        `Estimado/a **${userName}**, esta vista es la consola técnica del prototipo:\n` +
        `• **Motor**: SQLite en WebAssembly (\`sql.js\`).\n` +
        `• **Persistencia**: Almacenamiento binario en IndexedDB.\n` +
        `• **Exportación**: Permite descargar la copia física \`.sqlite\` de la base de datos al disco.`;

    default:
      return `ℹ️ Hola **${userName}**, estás en la intranet escolar del Instituto Educativo San Martín. Puedes realizarme cualquier consulta sobre el sistema.`;
  }
}
