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
    try {
      const res = dbInstance.exec("SELECT COUNT(*) FROM estudiantes");
      const count = res[0] ? res[0].values[0][0] : 0;
      if (count < 50) {
        console.log("Upgrading database to 100 students, 40 families, 20 teachers...");
        dbInstance.exec(`
          DROP TABLE IF EXISTS usuario_estudiantes;
          DROP TABLE IF EXISTS usuarios;
          DROP TABLE IF EXISTS estudiantes;
          DROP TABLE IF EXISTS calificaciones;
          DROP TABLE IF EXISTS asistencia;
          DROP TABLE IF EXISTS comunicados;
        `);
        await seedDatabase(dbInstance);
      }
    } catch (e) {
      console.warn("Reseeding database due to schema update:", e);
      await seedDatabase(dbInstance);
    }
  } else {
    console.log("Creating fresh SQLite database and seeding default data...");
    dbInstance = new SQL.Database();
    await seedDatabase(dbInstance);
  }

  // Migration / table check for usuario_estudiantes
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS usuario_estudiantes (
      usuario_id INTEGER NOT NULL,
      estudiante_id INTEGER NOT NULL,
      PRIMARY KEY (usuario_id, estudiante_id)
    );
    INSERT OR IGNORE INTO usuario_estudiantes (usuario_id, estudiante_id)
    SELECT id, estudiante_id FROM usuarios WHERE estudiante_id IS NOT NULL;
  `);

  const data = dbInstance.export();
  await saveToIndexedDB(data);

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

    CREATE TABLE IF NOT EXISTS usuario_estudiantes (
      usuario_id INTEGER NOT NULL,
      estudiante_id INTEGER NOT NULL,
      PRIMARY KEY (usuario_id, estudiante_id)
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

  // Hash default passwords
  const adminPass = await hashPassword('admin123');
  const docentePass = await hashPassword('docente123');
  const familiaPass = await hashPassword('familia123');

  // 1. Admin
  db.run(`
    INSERT INTO usuarios (username, password_hash, nombre, email, rol, estudiante_id)
    VALUES ('admin', '${adminPass}', 'Dirección San Martín', 'admin@sanmartin.edu.es', 'administracion', NULL);
  `);

  // 2. 20 Teachers
  const teacherFirstNames = ["Javier", "Ana", "Roberto", "Carmen", "Fernando", "Isabel", "Diego", "Laura", "Alberto", "Patricia", "Andrés", "Teresa", "Manuel", "Beatriz", "Gonzalo", "Cristina", "Ricardo", "Silvia", "Jorge", "Lucía"];
  const teacherLastNames = ["García", "Martínez", "López", "Ruiz", "Sánchez", "Torres", "Morales", "Navarro", "Romero", "Blanco", "Castro", "Ortega", "Delgado", "Mendoza", "Rubio", "Marín", "Núñez", "Medina", "Castillo", "Serrano"];

  for (let i = 0; i < 20; i++) {
    const fn = teacherFirstNames[i];
    const ln = teacherLastNames[i];
    const title = (i % 2 === 0) ? `Prof. ${fn} ${ln}` : `Profª. ${fn} ${ln}`;
    const username = `docente.${ln.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}${i + 1}`;
    const email = `${username}@sanmartin.edu.es`;
    db.run(
      `INSERT INTO usuarios (username, password_hash, nombre, email, rol, estudiante_id) VALUES (?, ?, ?, ?, ?, NULL)`,
      [username, docentePass, title, email, 'docente']
    );
  }

  // 3. 40 Families (Padres)
  const parentFirstNames = ["Carlos", "Elena", "Marta", "José", "María", "Luis", "Ana", "Pedro", "Sofia", "Juan", "Laura", "David", "Carmen", "Javier", "Lucía", "Miguel", "Isabel", "Antonio", "Paula", "Francisco", "Raquel", "Manuel", "Rosa", "Alejandro", "Teresa", "Daniel", "Alicia", "Jorge", "Beatriz", "Fernando", "Irene", "Gonzalo", "Silvia", "Adrián", "Patricia", "Hugo", "Clara", "Mario", "Nuria", "Sergio"];
  const parentLastNames = ["Pérez", "Gómez", "Fernández", "Rodríguez", "López", "González", "Martínez", "Sánchez", "Romero", "Torres", "Navarro", "Ruiz", "Díaz", "Serrano", "Muñoz", "Blanco", "Castro", "Morales", "Ortega", "Delgado", "Mendoza", "Ortiz", "Marín", "Rubio", "Núñez", "Medina", "Castillo", "Santos", "Iglesias", "Garrido", "Cano", "Prieto", "Molina", "Vidal", "Calvo", "Gallego", "Vargas", "Crespo", "Ramos", "Ibañez"];

  const familyUserIds = [];

  for (let i = 0; i < 40; i++) {
    const pfn = parentFirstNames[i];
    const pln = parentLastNames[i];
    const fullName = `${pfn} ${pln} (Familia)`;
    const cleanLn = pln.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const username = `familia.${cleanLn}${i + 1}`;
    const email = `${username}@sanmartin.edu.es`;

    db.run(
      `INSERT INTO usuarios (username, password_hash, nombre, email, rol, estudiante_id) VALUES (?, ?, ?, ?, ?, NULL)`,
      [username, familiaPass, fullName, email, 'estudiante_familia']
    );

    const res = db.exec(`SELECT last_insert_rowid() as id`);
    const uid = res[0].values[0][0];
    familyUserIds.push({ id: uid, nombre: `${pfn} ${pln}`, email });
  }

  // 4. 100 Students
  const studentFirstNames = [
    "Mateo", "Sofia", "Lucas", "Valentina", "Santiago", "Camila", "Gabriel", "Isabella", "Nicolas", "Lucia",
    "Daniel", "Mariana", "Alejandro", "Valeria", "Diego", "Emma", "Sebastian", "Victoria", "Benjamin", "Martina",
    "Leonardo", "Paula", "Joaquin", "Elena", "Samuel", "Sara", "Adrian", "Claudia", "David", "Alba",
    "Alvaro", "Carla", "Hugo", "Irene", "Mario", "Laura", "Pablo", "Noa", "Marcos", "Julia",
    "Gonzalo", "Natalia", "Ivan", "Eva", "Ruben", "Alicia", "Oliver", "Lola", "Alex", "Rocio",
    "Guillermo", "Candela", "Victor", "Clara", "Saul", "Marta", "Hector", "Nerea", "Iker", "Ines",
    "Eric", "Adriana", "Ignacio", "Miriam", "Marc", "Vera", "Pau", "Vega", "Leo", "Berta",
    "Bruno", "Diana", "Piero", "Nora", "Dante", "Elia", "Enzo", "Gemma", "Joel", "Lidia",
    "Axel", "Nuria", "Alan", "Marina", "Ian", "Leire", "Dylan", "Ainhoa", "Thiago", "Celia",
    "Adam", "Sheila", "Elias", "Sonia", "Gael", "Carlota", "Aaron", "Manuela", "Kilian", "Patricia"
  ];

  const studentLastNames = [
    "Pérez", "Gómez", "Fernández", "Rodríguez", "López", "González", "Martínez", "Sánchez", "Romero", "Torres",
    "Navarro", "Ruiz", "Díaz", "Serrano", "Muñoz", "Blanco", "Castro", "Morales", "Ortega", "Delgado",
    "Mendoza", "Ortiz", "Marín", "Rubio", "Núñez", "Medina", "Castillo", "Santos", "Iglesias", "Garrido",
    "Cano", "Prieto", "Molina", "Vidal", "Calvo", "Gallego", "Vargas", "Crespo", "Ramos", "Ibañez",
    "Aguilar", "Pascual", "Herrera", "Medina", "Vega", "Montero", "Hidalgo", "Gimenez", "Soria", "Vicente",
    "Soler", "Velasco", "Esteban", "Bravo", "Gallardo", "Pardo", "Lara", "Rivas", "Espinosa", "Campos",
    "Cabrera", "Moya", "Reyes", "Duran", "Vila", "Fuentes", "Cortes", "Agudo", "Diez", "Caballero",
    "Nieto", "Vázquez", "Pastor", "Sáez", "Lorenzo", "Heredia", "Montero", "Solís", "Guerra", "Carmona",
    "Velasco", "Bernal", "Paz", "Mora", "Ferrer", "Arias", "Valero", "Redondo", "Izquierdo", "Raya",
    "Vargas", "Santamaria", "Crespo", "Guerrero", "Marquez", "Roman", "Mendonca", "Gimeno", "Gallego", "Rios"
  ];

  const cursosList = [
    "1º Educación Primaria",
    "2º Educación Primaria",
    "3º Educación Primaria",
    "4º Educación Primaria",
    "5º Educación Primaria",
    "6º Educación Primaria"
  ];
  const seccionesList = ["A", "B"];

  for (let i = 1; i <= 100; i++) {
    const fn = studentFirstNames[i - 1];
    const ln = studentLastNames[i - 1];
    const fullName = `${fn} ${ln}`;
    const code = `EST-2026-${String(i).padStart(3, '0')}`;
    const curso = cursosList[(i - 1) % cursosList.length];
    const seccion = seccionesList[(i - 1) % seccionesList.length];

    const familyIndex = (i - 1) % 40;
    const parent = familyUserIds[familyIndex];

    const year = 2014 + ((i - 1) % 6);
    const month = String(((i % 12) + 1)).padStart(2, '0');
    const day = String(((i % 28) + 1)).padStart(2, '0');
    const dob = `${year}-${month}-${day}`;

    db.run(
      `INSERT INTO estudiantes (id, codigo, nombre, curso, seccion, tutor_nombre, tutor_email, fecha_nacimiento) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [i, code, fullName, curso, seccion, parent.nombre, parent.email, dob]
    );

    // Link student in usuario_estudiantes
    db.run(
      `INSERT INTO usuario_estudiantes (usuario_id, estudiante_id) VALUES (?, ?)`,
      [parent.id, i]
    );

    // Also set main estudiante_id on usuarios table if null
    db.run(
      `UPDATE usuarios SET estudiante_id = ? WHERE id = ? AND estudiante_id IS NULL`,
      [i, parent.id]
    );
  }

  // 5. Seed Calificaciones & Asistencia for 100 students
  const asignaturasList = ["Matemáticas", "Lengua Castellana", "Ciencias Naturales", "Ciencias Sociales", "Inglés", "Educación Física"];
  const docentesList = ["Prof. Javier García", "Profª. Ana Martínez", "Prof. Roberto López", "Profª. Carmen Ruiz"];

  for (let i = 1; i <= 100; i++) {
    const nota1 = (6.0 + ((i * 3) % 41) / 10).toFixed(1);
    const nota2 = (6.5 + ((i * 7) % 36) / 10).toFixed(1);
    const asig1 = asignaturasList[(i - 1) % asignaturasList.length];
    const asig2 = asignaturasList[(i + 1) % asignaturasList.length];
    const doc = docentesList[i % docentesList.length];

    db.run(
      `INSERT INTO calificaciones (estudiante_id, asignatura, trimestre, nota, observacion, docente_nombre) VALUES (?, ?, ?, ?, ?, ?)`,
      [i, asig1, '1º Trimestre', parseFloat(nota1), 'Buen desempeño y participación constante.', doc]
    );
    db.run(
      `INSERT INTO calificaciones (estudiante_id, asignatura, trimestre, nota, observacion, docente_nombre) VALUES (?, ?, ?, ?, ?, ?)`,
      [i, asig2, '1º Trimestre', parseFloat(nota2), 'Cumple adecuadamente con los contenidos.', doc]
    );

    const estado = (i % 9 === 0) ? 'Ausente' : (i % 7 === 0) ? 'Tardanza' : (i % 11 === 0) ? 'Justificado' : 'Presente';
    db.run(
      `INSERT INTO asistencia (estudiante_id, fecha, estado, observacion, docente_nombre) VALUES (?, ?, ?, ?, ?)`,
      [i, '2026-08-11', 'Presente', 'Puntualidad en aula', doc]
    );
    db.run(
      `INSERT INTO asistencia (estudiante_id, fecha, estado, observacion, docente_nombre) VALUES (?, ?, ?, ?, ?)`,
      [i, '2026-08-12', estado, estado === 'Justificado' ? 'Cita médica notificada por tutor/a' : '', doc]
    );
  }

  // 6. Comunicados
  db.run(`
    INSERT INTO comunicados (titulo, contenido, categoria, destinatarios, autor_nombre, fecha, fijado)
    VALUES 
    ('Bienvenida al Curso Escolar 2026-2027', 'Damos la bienvenida a toda la comunidad educativa del Instituto San Martín. Recordamos que las reuniones presenciales con tutores comenzarán la próxima semana.', 'General', 'Todos', 'Dirección San Martín', '2026-08-01 09:00:00', 1),
    ('Circular sobre Horario de Actividades Extracurriculares', 'Se publican los horarios provisionales de robótica, baloncesto y teatro. Las inscripciones se gestionan directamente a través del formulario oficial.', 'General', 'Familias', 'Dirección San Martín', '2026-08-05 11:30:00', 0),
    ('Reunión Claustro de Docentes - Evaluación Diagnóstica', 'Estimados docentes, este viernes a las 14:00h tendremos la sesión extraordinaria para revisar los protocolos de apoyo educativo.', 'Académico', 'Docentes', 'Prof. Javier García', '2026-08-08 16:00:00', 0),
    ('Recordatorio: Excursión al Museo de Ciencias', 'Confirmamos el pago de la autorización para los alumnos de Primaria antes del próximo viernes.', 'Evento', 'Familias', 'Profª. Ana Martínez', '2026-08-11 10:15:00', 1);
  `);

  console.log("Database seeded with 100 students, 40 families, and 20 teachers.");
}

export async function resetDatabaseToSeed() {
  if (!dbInstance) return;
  dbInstance.exec(`
    DROP TABLE IF EXISTS usuario_estudiantes;
    DROP TABLE IF EXISTS usuarios;
    DROP TABLE IF EXISTS estudiantes;
    DROP TABLE IF EXISTS calificaciones;
    DROP TABLE IF EXISTS asistencia;
    DROP TABLE IF EXISTS comunicados;
  `);
  await seedDatabase(dbInstance);
  await persistDb();
}

export function getUserStudents(userId) {
  if (!userId) return [];
  return query(`
    SELECT e.* 
    FROM estudiantes e
    JOIN usuario_estudiantes ue ON e.id = ue.estudiante_id
    WHERE ue.usuario_id = ?
    ORDER BY e.nombre ASC
  `, [userId]);
}

export async function setUserStudents(userId, studentIds = []) {
  if (!userId) return;
  const db = getDb();
  db.run(`DELETE FROM usuario_estudiantes WHERE usuario_id = ?`, [userId]);
  for (const stId of studentIds) {
    if (stId) {
      db.run(`INSERT OR IGNORE INTO usuario_estudiantes (usuario_id, estudiante_id) VALUES (?, ?)`, [userId, parseInt(stId)]);
    }
  }
  const mainStudentId = studentIds.length > 0 && studentIds[0] ? parseInt(studentIds[0]) : null;
  db.run(`UPDATE usuarios SET estudiante_id = ? WHERE id = ?`, [mainStudentId, userId]);
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
