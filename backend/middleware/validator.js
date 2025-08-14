const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const registerRules = [
    body('email').isEmail().withMessage('Debe ser un correo electrónico válido.'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.'),
    body('nombre').notEmpty().withMessage('El nombre es requerido.'),
    handleValidationErrors
];

const changePasswordRules = [
    body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida.'),
    body('newPassword').isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres.'),
    handleValidationErrors
];

const employeeProfileRules = [
    body('nombre_empleado').notEmpty().withMessage('El nombre del empleado es requerido.'),
    body('fecha_inicio_relacion_laboral').isISO8601().withMessage('La fecha debe estar en formato YYYY-MM-DD.'),
    body('category_id').isInt({ min: 1 }).withMessage('Debe seleccionar una categoría.'),
    body('valor_hora_personalizado').optional({ checkFalsy: true }).isFloat({ gt: 0 }).withMessage('El valor hora debe ser un número positivo.'),
    handleValidationErrors
];

const workEntryRules = [
    body('fecha').isISO8601().withMessage('La fecha debe estar en formato YYYY-MM-DD.'),
    body('horas_normales').optional().isFloat({ min: 0 }).withMessage('Las horas deben ser un número no negativo.'),
    body('horas_extras_50').optional().isFloat({ min: 0 }).withMessage('Las horas deben ser un número no negativo.'),
    body('horas_extras_100').optional().isFloat({ min: 0 }).withMessage('Las horas deben ser un número no negativo.'),
    body('valor_hora_base_aplicado').isFloat({ gt: 0 }).withMessage('El valor hora debe ser un número positivo.'),
    body('employee_profile_id').isInt({ min: 1 }).withMessage('El ID del empleado es requerido.'),
    handleValidationErrors
];

const payrollConceptRules = [
    body('type').isIn(['addition', 'deduction']).withMessage('El tipo debe ser "addition" o "deduction".'),
    body('description').notEmpty().withMessage('La descripción es requerida.'),
    body('amount').isFloat({ gt: 0 }).withMessage('El monto debe ser un número positivo.'),
    body('is_non_remunerative').isBoolean().withMessage('Debe especificar si es no remunerativo.'),
    handleValidationErrors
];


module.exports = {
    registerRules,
    changePasswordRules,
    employeeProfileRules,
    workEntryRules,
    payrollConceptRules
};
