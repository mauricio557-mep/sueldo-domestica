const request = require('supertest');
const express = require('express');
// Importar la app de express. Para esto, necesitaremos refactorizar server.js
// para exportar la app. Por ahora, asumiremos que lo hace.
const app = require('../server'); 

describe('Auth Endpoints', () => {
    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({
                nombre: 'Test',
                apellido: 'User',
                email: `test-${Date.now()}@example.com`,
                password: 'Password123!',
                confirmPassword: 'Password123!'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'Registro exitoso. Revisa tu email para el código.');
    });

    it('should fail to register with a weak password', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({
                nombre: 'Test',
                apellido: 'User',
                email: `test-${Date.now()}@example.com`,
                password: '123',
                confirmPassword: '123'
            });
        expect(res.statusCode).toEqual(400);
        // Comprobamos que el array de errores contenga el mensaje correcto para el campo 'password'
        expect(res.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: 'password',
                    msg: 'La contraseña debe tener al menos 8 caracteres.'
                })
            ])
        );
    });

    it('should fail to register if email is already in use', async () => {
        const email = `test-duplicate-${Date.now()}@example.com`;
        // Primero, registrar un usuario
        await request(app)
            .post('/api/register')
            .send({
                nombre: 'Test',
                apellido: 'User',
                email: email,
                password: 'Password123!',
                confirmPassword: 'Password123!'
            });
        
        // Luego, intentar registrarlo de nuevo
        const res = await request(app)
            .post('/api/register')
            .send({
                nombre: 'Test',
                apellido: 'User',
                email: email,
                password: 'Password123!',
                confirmPassword: 'Password123!'
            });
        expect(res.statusCode).toEqual(409);
        expect(res.body).toHaveProperty('message', 'El email ya está registrado.');
    });
});
