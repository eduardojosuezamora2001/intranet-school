import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

// Web Crypto SHA-256 helper for client-side password hashing
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "_san_martin_salt_2026");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const IDB_NAME = 'IntranetSchoolDB';
const IDB_STORE = 'sqlite_store';
const IDB_KEY = 'sqlite_db_file';

// IndexedDB Helper Functions
function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadFromIndexedDB() {
  try {
    const idb = await openIDB();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(IDB_STORE, 'readonly');
      const store = transaction.objectStore(IDB_STORE);
      const request = store.get(IDB_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Could not load from IndexedDB:", err);
    return null;
  }
}

async function saveToIndexedDB(uint8Array) {
  try {
    const idb = await openIDB();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(IDB_STORE, 'readwrite');
      const store = transaction.objectStore(IDB_STORE);
      const request = store.put(uint8Array, IDB_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Failed to save DB to IndexedDB:", err);
  }
}

let dbInstance = null;
let SQL = null;

export async function initDatabase() {
  if (dbInstance) return dbInstance;

  SQL = await initSqlJs({
    locateFile: () => sqlWasmUrl
  });


  const savedData = await loadFromIndexedDB();

  if (savedData && savedData.length > 0) {
    console.log("Loaded existing SQLite database from IndexedDB.");
    dbInstance = new SQL.Database(savedData);
  } else {
    console.log("Creating fresh SQLite database and seeding default data...");
    dbInstance = new SQL.Database();
    await seedDatabase(dbInstance);
    const data = dbInstance.export();
    await saveToIndexedDB(data);
  }

  return dbInstance;
}

export function getDb() {
  if (!dbInstance) {
    throw new Error("Database not initialized! Call initDatabase() first.");
  }
  return dbInstance;
}

export async function persistDb() {
  if (dbInstance) {
    const data = dbInstance.export();
    await saveToIndexedDB(data);
  }
}

export function query(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export async function run(sql, params = []) {
  const db = getDb();
  db.run(sql, params);
  await persistDb();
}

async function seedDatabase(db) {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL,
      rol TEXT NOT NULL CHECK(rol IN ('administracion', 'docente', 'estudiante_familia')),
      estudiante_id INTEGER,
      fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS estudiantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      curso TEXT NOT NULL,
      seccion TEXT NOT NULL,
      tutor_nombre TEXT NOT NULL,
      tutor_email TEXT NOT NULL,
      fecha_nacimiento TEXT
    );

    CREATE TABLE IF NOT EXISTS calificaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estudiante_id INTEGER NOT NULL,
      asignatura TEXT NOT NULL,
      trimestre TEXT NOT NULL,
      nota REAL NOT NULL,
      observacion TEXT,
      fecha TEXT DEFAULT CURRENT_TIMESTAMP,
      docente_nombre TEXT NOT NULL,
      FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id)
    );

    CREATE TABLE IF NOT EXISTS asistencia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estudiante_id INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      estado TEXT NOT NULL CHECK(estado IN ('Presente', 'Ausente', 'Tardanza', 'Justificado')),
      observacion TEXT,
      docente_nombre TEXT NOT NULL,
      FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id)
    );

    CREATE TABLE IF NOT EXISTS comunicados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      contenido TEXT NOT NULL,
      categoria TEXT NOT NULL CHECK(categoria IN ('General', 'Académico', 'Urgente', 'Evento')),
      destinatarios TEXT NOT NULL CHECK(destinatarios IN ('Todos', 'Docentes', 'Familias')),
      autor_nombre TEXT NOT NULL,
      fecha TEXT DEFAULT CURRENT_TIMESTAMP,
      fijado INTEGER DEFAULT 0
    );
  `);

  // Seed Students
  db.run(`
    INSERT INTO estudiantes (id, codigo, nombre, curso, seccion, tutor_nombre, tutor_email, fecha_nacimiento)
    VALUES 
    (1, 'EST-2026-001', 'Mateo Pérez', '4º Educación Primaria', 'A', 'Carlos Pérez', 'familia.perez@sanmartin.edu.es', '2016-04-12'),
    (2, 'EST-2026-002', 'Sofia Gómez', '4º Educación Primaria', 'A', 'Elena Gómez', 'familia.gomez@sanmartin.edu.es', '2016-08-25'),
    (3, 'EST-2026-003', 'Lucas Fernández', '5º Educación Primaria', 'B', 'Marta Fernández', 'marta.f@sanmartin.edu.es', '2015-02-18');
  `);

  // Hash initial passwords
  const adminPass = await hashPassword('admin123');
  const docentePass = await hashPassword('docente123');
  const familiaPass = await hashPassword('familia123');

  // Seed Users
  db.run(`
    INSERT INTO usuarios (username, password_hash, nombre, email, rol, estudiante_id)
    VALUES 
    ('admin', '${adminPass}', 'Dirección San Martín', 'admin@sanmartin.edu.es', 'administracion', NULL),
    ('profesor.garcia', '${docentePass}', 'Prof. Javier García', 'javier.garcia@sanmartin.edu.es', 'docente', NULL),
    ('familia.perez', '${familiaPass}', 'Carlos Pérez (Padre de Mateo)', 'familia.perez@sanmartin.edu.es', 'estudiante_familia', 1),
    ('familia.gomez', '${familiaPass}', 'Elena Gómez (Madre de Sofia)', 'familia.gomez@sanmartin.edu.es', 'estudiante_familia', 2);
  `);

  // Seed Calificaciones (Grades)
  db.run(`
    INSERT INTO calificaciones (estudiante_id, asignatura, trimestre, nota, observacion, docente_nombre)
    VALUES 
    (1, 'Matemáticas', '1º Trimestre', 9.5, 'Excelente desempeño en resolución de problemas aritméticos.', 'Prof. Javier García'),
    (1, 'Lengua Castellana', '1º Trimestre', 8.8, 'Muy buena comprensión lectora y ortografía impecable.', 'Prof. Javier García'),
    (1, 'Ciencias Naturales', '1º Trimestre', 9.0, 'Gran participación en el proyecto de ecosistemas.', 'Prof. Javier García'),
    (1, 'Matemáticas', '2º Trimestre', 9.0, 'Mantiene el ritmo alto de trabajo.', 'Prof. Javier García'),
    (2, 'Matemáticas', '1º Trimestre', 7.5, 'Buen progreso, requiere repasar las tablas de multiplicar.', 'Prof. Javier García'),
    (2, 'Lengua Castellana', '1º Trimestre', 9.2, 'Destacada creatividad en la redacción de cuentos.', 'Prof. Javier García'),
    (3, 'Matemáticas', '1º Trimestre', 8.0, 'Buen rendimiento continuo.', 'Prof. Javier García');
  `);

  // Seed Attendance
  db.run(`
    INSERT INTO asistencia (estudiante_id, fecha, estado, observacion, docente_nombre)
    VALUES 
    (1, '2026-08-10', 'Presente', 'Puntualidad en aula', 'Prof. Javier García'),
    (1, '2026-08-11', 'Presente', '', 'Prof. Javier García'),
    (1, '2026-08-12', 'Justificado', 'Cita médica notificada por la familia', 'Prof. Javier García'),
    (2, '2026-08-10', 'Presente', '', 'Prof. Javier García'),
    (2, '2026-08-11', 'Tardanza', 'Llegada 10 min tarde por tráfico', 'Prof. Javier García'),
    (2, '2026-08-12', 'Presente', '', 'Prof. Javier García'),
    (3, '2026-08-12', 'Ausente', 'Sin justificar aún', 'Prof. Javier García');
  `);

  // Seed Announcements (Comunicados)
  db.run(`
    INSERT INTO comunicados (titulo, contenido, categoria, destinatarios, autor_nombre, fecha, fijado)
    VALUES 
    ('Bienvenida al Curso Escolar 2026-2027', 'Damos la bienvenida a toda la comunidad educativa del Instituto San Martín. Recordamos que las reuniones presenciales con tutores comenzarán la próxima semana.', 'General', 'Todos', 'Dirección San Martín', '2026-08-01 09:00:00', 1),
    ('Circular sobre Horario de Actividades Extracurriculares', 'Se publican los horarios provisionales de robótica, baloncesto y teatro. Las inscripciones se gestionan directamente a través del formulario oficial.', 'General', 'Familias', 'Dirección San Martín', '2026-08-05 11:30:00', 0),
    ('Reunión Claustro de Docentes - Evaluación Diagnóstica', 'Estimados docentes, este viernes a las 14:00h tendremos la sesión extraordinaria para revisar los protocolos de apoyo educativo.', 'Académico', 'Docentes', 'Prof. Javier García', '2026-08-08 16:00:00', 0),
    ('Recordatorio: Excursión al Museo de Ciencias', 'Confirmamos el pago de la autorización para los alumnos de 4º y 5º Primaria antes del próximo viernes.', 'Evento', 'Familias', 'Prof. Javier García', '2026-08-11 10:15:00', 1);
  `);

  console.log("Database seeded successfully.");
}

export async function resetDatabaseToSeed() {
  if (!dbInstance) return;
  dbInstance.exec(`
    DROP TABLE IF EXISTS usuarios;
    DROP TABLE IF EXISTS estudiantes;
    DROP TABLE IF EXISTS calificaciones;
    DROP TABLE IF EXISTS asistencia;
    DROP TABLE IF EXISTS comunicados;
  `);
  await seedDatabase(dbInstance);
  await persistDb();
}

export function exportSqliteFile() {
  if (!dbInstance) return;
  const binaryArray = dbInstance.export();
  const blob = new Blob([binaryArray], { type: 'application/x-sqlite3' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `intranet_san_martin_${new Date().toISOString().slice(0, 10)}.sqlite`;
  a.click();
  URL.revokeObjectURL(a.href);
}
