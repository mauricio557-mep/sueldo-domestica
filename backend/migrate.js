const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function setupDatabase(db) {
  console.log('Ejecutando migración de la base de datos...');
  
  await db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL)`);
  const userColumns = [
    { name: 'nombre', type: 'TEXT' }, { name: 'apellido', type: 'TEXT' }, { name: 'verification_code', type: 'TEXT' },
    { name: 'is_verified', type: 'INTEGER DEFAULT 0' }, { name: 'reset_token', type: 'TEXT' }, { name: 'reset_token_expires', type: 'INTEGER' }
  ];
  for (const column of userColumns) {
    try { await db.exec(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`); } catch (e) { if (!e.message.includes('duplicate column')) console.error(e); }
  }

  await db.exec(`CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL UNIQUE, descripcion TEXT)`);
  const categories = [
    { name: 'Personal para tareas generales', desc: 'Limpieza, lavado, planchado, etc.' }, { name: 'Asistencia y cuidado de personas', desc: 'Cuidado no terapéutico.' },
    { name: 'Personal para tareas específicas', desc: 'Cocineros/as, etc.' }, { name: 'Caseros', desc: 'Personal que reside en el lugar.' }, { name: 'Supervisión', desc: 'Coordina tareas de otros.' }
  ];
  for (const cat of categories) {
    try { await db.run('INSERT OR IGNORE INTO categories (nombre, descripcion) VALUES (?, ?)', [cat.name, cat.desc]); } catch (e) { console.error(e); }
  }

  await db.exec(`CREATE TABLE IF NOT EXISTS employee_profiles (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, nombre_empleado TEXT NOT NULL, fecha_inicio_relacion_laboral TEXT NOT NULL, category_id INTEGER, valor_hora_personalizado REAL, FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE, FOREIGN KEY (category_id) REFERENCES categories (id))`);
  try { await db.exec(`ALTER TABLE employee_profiles ADD COLUMN valor_hora_personalizado REAL`); } catch (e) { if (!e.message.includes('duplicate column')) console.error(e); }

  await db.exec(`CREATE TABLE IF NOT EXISTS legislation_pay_scales (id INTEGER PRIMARY KEY AUTOINCREMENT, category_id INTEGER NOT NULL, valor_hora REAL NOT NULL, fecha_vigencia_desde TEXT NOT NULL, descripcion TEXT, FOREIGN KEY (category_id) REFERENCES categories (id))`);
  await db.exec(`CREATE TABLE IF NOT EXISTS work_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, employee_profile_id INTEGER NOT NULL, fecha TEXT NOT NULL, horas_normales REAL DEFAULT 0, horas_extras_50 REAL DEFAULT 0, horas_extras_100 REAL DEFAULT 0, valor_hora_base_aplicado REAL NOT NULL, descripcion TEXT, FOREIGN KEY (employee_profile_id) REFERENCES employee_profiles (id) ON DELETE CASCADE)`);
  await db.exec(`CREATE TABLE IF NOT EXISTS payrolls (id INTEGER PRIMARY KEY AUTOINCREMENT, employee_profile_id INTEGER NOT NULL, mes INTEGER NOT NULL, anio INTEGER NOT NULL, estado TEXT NOT NULL DEFAULT 'pendiente', subtotal_horas_normales REAL, subtotal_horas_extras_50 REAL, subtotal_horas_extras_100 REAL, adicional_antiguedad REAL, monto_total_final REAL NOT NULL, detalles TEXT, FOREIGN KEY (employee_profile_id) REFERENCES employee_profiles (id) ON DELETE CASCADE)`);
  await db.exec(`CREATE TABLE IF NOT EXISTS payroll_concepts (id INTEGER PRIMARY KEY AUTOINCREMENT, payroll_id INTEGER NOT NULL, type TEXT NOT NULL, description TEXT NOT NULL, amount REAL NOT NULL, is_non_remunerative INTEGER DEFAULT 0, FOREIGN KEY (payroll_id) REFERENCES payrolls (id) ON DELETE CASCADE)`);
  await db.exec(`CREATE TABLE IF NOT EXISTS sac_payrolls (id INTEGER PRIMARY KEY AUTOINCREMENT, employee_profile_id INTEGER NOT NULL, anio INTEGER NOT NULL, semestre INTEGER NOT NULL, mejor_sueldo REAL NOT NULL, monto_sac REAL NOT NULL, es_proporcional INTEGER NOT NULL, detalles TEXT, fecha_guardado TEXT NOT NULL, FOREIGN KEY (employee_profile_id) REFERENCES employee_profiles (id) ON DELETE CASCADE)`);
  await db.exec(`CREATE TABLE IF NOT EXISTS vacation_payrolls (id INTEGER PRIMARY KEY AUTOINCREMENT, employee_profile_id INTEGER NOT NULL, anio INTEGER NOT NULL, dias_correspondientes INTEGER NOT NULL, monto_vacaciones REAL NOT NULL, detalles TEXT, fecha_guardado TEXT NOT NULL, FOREIGN KEY (employee_profile_id) REFERENCES employee_profiles (id) ON DELETE CASCADE)`);

  console.log('Migración finalizada.');
}

if (require.main === module) {
    (async () => {
        const dbPath = path.join(__dirname, 'database.db');
        const db = await open({ filename: dbPath, driver: sqlite3.Database });
        await setupDatabase(db);
        await db.close();
    })();
}

module.exports = { setupDatabase };
