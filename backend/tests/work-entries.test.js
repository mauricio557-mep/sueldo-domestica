const request = require('supertest');
const app = require('../server');

describe('Work Entry Endpoints', () => {
    let token;
    let employeeId;

    beforeAll(async () => {
        // Necesitamos un usuario y un empleado para estas pruebas
        const userEmail = `work-test-${Date.now()}@example.com`;
        await request(app).post('/api/register').send({
            nombre: 'WorkTest', apellido: 'User', email: userEmail,
            password: 'Password123!', confirmPassword: 'Password123!'
        });
        const loginRes = await request(app).post('/api/login').send({ email: userEmail, password: 'Password123!' });
        token = loginRes.body.token;

        const empRes = await request(app)
            .post('/api/employee-profile')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre_empleado: 'Trabajador de Prueba',
                fecha_inicio_relacion_laboral: '2021-01-01',
                category_id: 1
            });
        employeeId = empRes.body.new_id;
    });

    it('should create a new work entry successfully', async () => {
        const res = await request(app)
            .post('/api/work-entries')
            .set('Authorization', `Bearer ${token}`)
            .send({
                fecha: '2025-07-22',
                horas_normales: 8,
                horas_extras_50: 1,
                horas_extras_100: 0,
                valor_hora_base_aplicado: 2500,
                descripcion: 'Día normal',
                employee_profile_id: employeeId
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'Registro guardado.');
    });

    it('should get work entries for a specific month', async () => {
        const res = await request(app)
            .get(`/api/work-entries?mes=7&anio=2025&employee_id=${employeeId}`)
            .set('Authorization', `Bearer ${token}`);
        
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].horas_normales).toBe(8);
    });
    
    it('should fail to create a duplicate entry for the same day', async () => {
        const res = await request(app)
            .post('/api/work-entries')
            .set('Authorization', `Bearer ${token}`)
            .send({
                fecha: '2025-07-22', // Misma fecha
                horas_normales: 4,
                valor_hora_base_aplicado: 2500,
                employee_profile_id: employeeId
            });
        expect(res.statusCode).toEqual(409);
    });
});
