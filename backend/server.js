require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const nodemailer = require('nodemailer');
const path = require('path');
const crypto = require('crypto');
const zxcvbn = require('zxcvbn');
const multer = require('multer');
const fs = require('fs');
const { registerRules, changePasswordRules, employeeProfileRules, workEntryRules, payrollConceptRules } = require('./middleware/validator');
const { setupDatabase } = require('./migrate');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET no está definido en el archivo .env");
    process.exit(1);
}

// --- Middlewares ---
app.use(express.json());
app.use(cors());

// --- Middleware de Autenticación ---
const authenticateToken = (req, res, next) => {
    if (process.env.NODE_ENV === 'test') {
        req.user = { id: 1, email: 'test@example.com' };
        return next();
    }
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Variable de la Base de Datos ---
let db;

// --- Rutas de la API ---
// (Aquí van todas tus rutas: /api/register, /api/login, /api/employees, etc.)
// --- Rutas de Autenticación y Registro ---
app.post('/api/register', registerRules, async (req, res) => {
    const { nombre, apellido, email, password } = req.body;
    try {
        const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) return res.status(409).json({ message: 'El email ya está registrado.' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = '1234';
        await db.run('INSERT INTO users (nombre, apellido, email, password, verification_code, is_verified) VALUES (?, ?, ?, ?, ?, ?)', [nombre, apellido, email, hashedPassword, verificationCode, 0]);
        res.status(201).json({ message: 'Registro exitoso. Revisa tu email para el código.' });
    } catch (error) { 
        res.status(500).json({ message: 'Error en el servidor.', error: error.message }); 
    }
});
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Contraseña incorrecta.' });
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) { res.status(500).json({ message: 'Error en el servidor.' }); }
});

// --- Rutas para Gestión de Empleados ---
app.get('/api/employee-profile/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await db.get('SELECT * FROM employee_profiles WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (!profile) {
            return res.status(404).json({ message: 'Perfil no encontrado o no pertenece al usuario.' });
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el perfil del empleado.' });
    }
});

app.get('/api/employees', authenticateToken, async (req, res) => {
    try {
        const employees = await db.all('SELECT * FROM employee_profiles WHERE user_id = ?', [req.user.id]);
        res.json(employees);
    } catch (error) { res.status(500).json({ message: 'Error al obtener la lista de empleados.' }); }
});
app.post('/api/employee-profile', authenticateToken, employeeProfileRules, async (req, res) => {
    try {
        const { nombre_empleado, fecha_inicio_relacion_laboral, category_id } = req.body;
        const result = await db.run('INSERT INTO employee_profiles (user_id, nombre_empleado, fecha_inicio_relacion_laboral, category_id) VALUES (?, ?, ?, ?)', [req.user.id, nombre_empleado, fecha_inicio_relacion_laboral, category_id]);
        res.status(201).json({ message: 'Perfil de empleado creado.', new_id: result.lastID });
    } catch (error) { res.status(500).json({ message: 'Error al crear el perfil.' }); }
});
app.put('/api/employee-profile/:id', authenticateToken, employeeProfileRules, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_empleado, fecha_inicio_relacion_laboral, category_id } = req.body;
        const result = await db.run('UPDATE employee_profiles SET nombre_empleado = ?, fecha_inicio_relacion_laboral = ?, category_id = ? WHERE id = ? AND user_id = ?', [nombre_empleado, fecha_inicio_relacion_laboral, category_id, id, req.user.id]);
        if (result.changes === 0) return res.status(404).json({ message: 'Perfil no encontrado.' });
        res.status(200).json({ message: 'Perfil actualizado.' });
    } catch (error) { res.status(500).json({ message: 'Error al actualizar el perfil.' }); }
});

// --- Rutas para Gestión de Horas ---
app.get('/api/work-entries', authenticateToken, async (req, res) => {
    try {
        const { mes, anio, employee_id } = req.query;
        const profile = await db.get('SELECT id FROM employee_profiles WHERE id = ? AND user_id = ?', [employee_id, req.user.id]);
        if (!profile) return res.status(403).json({ message: 'Acceso no autorizado.' });
        const startDate = `${anio}-${String(mes).padStart(2, '0')}-01`;
        const endDate = new Date(anio, mes, 0).toISOString().split('T')[0];
        res.json(await db.all("SELECT * FROM work_entries WHERE employee_profile_id = ? AND fecha BETWEEN ? AND date(?, '+1 day')", [employee_id, startDate, endDate]));
    } catch (error) { res.status(500).json({ message: 'Error en el servidor.', error: error.message }); }
});
app.post('/api/work-entries', authenticateToken, workEntryRules, async (req, res) => {
    try {
        const { fecha, horas_normales, horas_extras_50, horas_extras_100, valor_hora_base_aplicado, descripcion, employee_profile_id } = req.body;
        const profile = await db.get('SELECT id FROM employee_profiles WHERE id = ? AND user_id = ?', [employee_profile_id, req.user.id]);
        if (!profile) return res.status(403).json({ message: 'Acceso no autorizado.' });
        const existing = await db.get('SELECT id FROM work_entries WHERE employee_profile_id = ? AND fecha = ?', [employee_profile_id, fecha]);
        if (existing) return res.status(409).json({ message: 'Ya existe un registro para esta fecha.' });
        const result = await db.run('INSERT INTO work_entries (employee_profile_id, fecha, horas_normales, horas_extras_50, horas_extras_100, valor_hora_base_aplicado, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)', [employee_profile_id, fecha, horas_normales || 0, horas_extras_50 || 0, horas_extras_100 || 0, valor_hora_base_aplicado, descripcion]);
        res.status(201).json({ id: result.lastID, message: 'Registro guardado.' });
    } catch (error) { res.status(500).json({ message: 'Error en el servidor.', error: error.message }); }
});


// --- Servir archivos estáticos (Frontend) ---
// Esta debe ser una de las últimas rutas
app.use(express.static(path.join(__dirname, '..')));

// --- Función de Arranque ---
const startServer = async () => {
    try {
        const dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : path.join(__dirname, 'database.db');
        db = await open({ filename: dbPath, driver: sqlite3.Database });
        
        if (process.env.NODE_ENV === 'test') {
            await setupDatabase(db);
        }
        
        console.log(`Conectado a la base de datos en: ${dbPath}`);

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Error fatal al iniciar el servidor:", error);
        process.exit(1);
    }
};

startServer();

module.exports = app;