const request = require('supertest');
const app = require('../server');

describe('Employee Endpoints', () => {
    let token;
    let employeeId;

    // Antes de las pruebas de empleados, necesitamos un usuario y un token
    beforeAll(async () => {
        // Crear un usuario para las pruebas
        await request(app)
            .post('/api/register')
            .send({
                nombre: 'EmployeeTest',
                apellido: 'User',
                email: `employee-test-${Date.now()}@example.com`,
                password: 'Password123!',
                confirmPassword: 'Password123!'
            });
        
        // Iniciar sesión para obtener un token
        const res = await request(app)
            .post('/api/login')
            .send({
                email: `employee-test-${Date.now()}@example.com`,
                password: 'Password123!'
            });
        token = res.body.token;
    });

    it('should create a new employee profile successfully', async () => {
        const res = await request(app)
            .post('/api/employee-profile')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre_empleado: 'Juan Perez',
                fecha_inicio_relacion_laboral: '2020-01-15',
                category_id: 1
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'Perfil de empleado creado.');
        expect(res.body).toHaveProperty('new_id');
        employeeId = res.body.new_id;
    });

    it('should get the list of employees', async () => {
        const res = await request(app)
            .get('/api/employees')
            .set('Authorization', `Bearer ${token}`);
            
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].nombre_empleado).toBe('Juan Perez');
    });

    it('should update an employee profile successfully', async () => {
        const res = await request(app)
            .put(`/api/employee-profile/${employeeId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre_empleado: 'Juan Carlos Perez',
                fecha_inicio_relacion_laboral: '2020-01-15',
                category_id: 2
            });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Perfil actualizado.');
    });
});
