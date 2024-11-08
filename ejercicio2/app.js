const mysql = require('mysql');
const express = require('express');
const path = require('path');
const session = require('express-session');
const mysqlSession = require('express-mysql-session');
const createAuthRouter = require('./routes/auth.js');

const app = express();
const PORT = 3000;

// Configuración de la base de datos
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    port: 3306,
    password: "",
    database: "AW_24"
});

// Configuración de la sesión
const mysqlStore = mysqlSession(session);
const sessionStore = new mysqlStore({
    host: "localhost",
    user: "root",
    password: "",
    database: "AW_24"
});

const middlewareSession = session({
    saveUninitialized: false,
    resave: true,
    secret: 'secret',
    store: sessionStore
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(middlewareSession);

// Configuración del motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rutas
app.use('/auth', createAuthRouter(pool, middlewareSession));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Inicio.html'));
});

app.get('/registro', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Registro.html'));
});

app.get('/facultades', (req, res, next) => {
    const sql = 'SELECT * FROM facultades';
    pool.query(sql, (err, rows) => {
        if (err) return next(err);
        res.status(200).send(rows);
    });
});

function requireAuth(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        res.status(401).send('Debes iniciar sesión para acceder a esta página.');
    }
}

function getEventos(req, res, next) {
    const sql = 'SELECT * FROM eventos';
    pool.query(sql, (err, rows) => {
        if (err) return next(err);
        req.eventos = rows;
        next();
    });
}

app.post('/eventos', requireAuth, getEventos, (req, res) => {
    res.status(200).json(req.eventos);
});

app.get('/dashboard', requireAuth, getEventos, (req, res) => {
    res.render('dashboard', { user: req.session.user, eventos: req.eventos });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    res.status(500).render('error500', {
        mensaje: err.message,
        pila: err.stack
    });
});

app.use((req, res) => {
    res.status(404).render('error404', { url: req.url });
});

app.listen(PORT, (err) => {
    if (err) {
        console.error(`Error al iniciar el servidor: ${err}`);
    } else {
        console.log(`Server listening on http://localhost:${PORT}`);
    }
});
