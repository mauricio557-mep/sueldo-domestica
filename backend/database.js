  // Importamos las librerías necesarias
  const sqlite3 = require('sqlite3').verbose();
  const { open } = require('sqlite');
 
  // Función asíncrona para abrir la conexión y crear la tabla
  async function setup() {
    // Abrimos la base de datos. Si el archivo no existe, se creará.
    const db = await open({
      filename: './database.db', // Nombre del archivo de la base de datos
      driver: sqlite3.Database
    });
 
    // Ejecutamos una consulta para crear la tabla 'users' si no existe
    // TEXT y NOT NULL significan que el campo no puede estar vacío
    // UNIQUE significa que no puede haber dos usuarios con el mismo email
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);
 
    console.log('Base de datos configurada y tabla de usuarios asegurada.');
 
    // Cerramos la conexión
    await db.close();
  }
 
  // Ejecutamos la función de configuración
  setup();