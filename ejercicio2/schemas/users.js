const z = require('zod');

// Esquema de validación para usuario
const userSchema = z.object({
    nombre: z.string().nonempty({ message: 'Nombre es requerido' }),
    email: z.string().nonempty({ message: 'Email es requerido' }).email({ message: 'Email no tiene el formato correcto' }),
    telefonoCompleto: z.string().nonempty({ message: 'Teléfono es requerido' })
        .min(10, { message: 'Teléfono debe tener al menos 10 caracteres' }),
    rol: z.enum(['participante', 'organizador'], { message: 'Rol es requerido' }),
    facultad: z.string().nonempty({ message: 'Facultad es requerida' }),
    password: z.string().min(8, { message: 'Contraseña debe tener al menos 8 caracteres' })
}).superRefine((data, ctx) => {
    const emailRegex = new RegExp(`.*@${data.facultad.toLowerCase()}\.com$`);
    if (!emailRegex.test(data.email.toLowerCase())) {
        ctx.addIssue({
            path: ['email'],
            message: 'Email no tiene el formato correcto para la facultad',
        });
    }
});

// Esquema de validación para login
const loginSchema = z.object({
    email: z.string().nonempty({ message: 'Email es requerido' }).email({ message: 'Email no tiene el formato correcto' }),
    password: z.string().nonempty({ message: 'Contraseña es requerida' })
});

// Middleware de validación
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error.errors });
    }
    next();
};

module.exports = {
    validateLogIn: validate(loginSchema),
    validateUser: validate(userSchema)
};
