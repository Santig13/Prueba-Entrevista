const { Router } = require('express');
const bcrypt = require('bcrypt');
const { validateLogIn, validateUser } = require('../schemas/users');

function createAuthRouter(pool, sessionMiddleware) {
    const router = Router();

    router.use(sessionMiddleware);

    router.post('/login', validateLogIn, async (req, res, next) => {
        const { email, password } = req.body;
        try {
            const connection = await pool.getConnection();
            const [rows] = await connection.query('SELECT * FROM usuarios WHERE email = ?', [email]);
            connection.release();

            if (rows.length > 0) {
                const user = rows[0];
                const isMatch = await bcrypt.compare(password, user.password);
                const { password: _, ...userWithoutPassword } = user;

                if (isMatch) {
                    req.session.user = userWithoutPassword;
                    res.redirect('/dashboard');
                } else {
                    res.status(400).send('Email o contraseña incorrectos');
                }
            } else {
                res.status(400).send('Email o contraseña incorrectos');
            }
        } catch (err) {
            next(err);
        }
    });

    router.post('/logout', (req, res) => {
        req.session.destroy(err => {
            if (err) return res.status(500).send('Error al cerrar sesión');
            res.redirect('/');
        });
    });

    router.post('/register', validateUser, async (req, res, next) => {
        const { nombre, email, telefonoCompleto, facultad, rol, password } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const connection = await pool.getConnection();

            const [facultadRows] = await connection.query('SELECT id FROM facultades WHERE nombre = ?', [facultad]);
            let facultad_id;

            if (facultadRows.length > 0) {
                facultad_id = facultadRows[0].id;
            } else {
                const [result] = await connection.query('INSERT INTO facultades(nombre) VALUES(?)', [facultad]);
                facultad_id = result.insertId;
            }

            await connection.query('INSERT INTO usuarios(nombre, email, telefono, facultad_id, rol, accesibilidad_id, password) VALUES(?, ?, ?, ?, ?, ?, ?)', [nombre, email, telefonoCompleto, facultad_id, rol, 1, hashedPassword]);
            connection.release();
            res.redirect('/?success=true');
        } catch (err) {
            next(err);
        }
    });

    return router;
}

module.exports = createAuthRouter;
