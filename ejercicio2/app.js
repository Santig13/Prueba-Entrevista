const mysql=require('mysql');
const express=require('express');
const path=require('path');
const session = require('express-session');
const mysqlSession = require('express-mysql-session');
const createAuthRouter = require('./routes/auth.js');
const mysqlStore = mysqlSession(session);
const util = require('util');
const { get } = require('http');

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

//Configuración del servidor
const app= express();
const PORT=3000;

//Configuración de la base de datos
const pool=mysql.createPool({
    host: "localhost",
    user: "root",
    port: 3306,
    password: "",
    database: "AW_24"
});

 
// Middleware para parsear datos de formularioy aceptar JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para que cargue todos los archivos estáticos y poder usar js y css en el html
app.use(express.static(path.join(__dirname, 'public')));

app.use(middlewareSession);

// Utiliza el router de autenticación
app.use('/auth', createAuthRouter(pool, middlewareSession));

// Configurar el motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//Middleware para  el manejo de errores
app.use((err,req,res,next)=>{
    res.status(500);
    res.render('error500', {
        mensaje: err.message,
        pila: err.stack
    });
});



//NAVEGACION A LAS PAGINAS

//Navegacion a la pagina de inicio
app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','Inicio.html'));
});
//Navegacion a la pagina de registro
app.get('/registro',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','Registro.html'));
});

//Obtener todas las facultades para la página de registro
app.get('/facultades',  (req,res,next)=>{
        const sql='SELECT * FROM facultades';
        pool.query(sql, (err, results) => {
            if (err) {
                return next(err);
            }
            res.status(200).json(results);
        });
});  

// Middleware de autenticación
function requireAuth(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        res.status(401).send('Debes iniciar sesión para acceder a esta página.');
    }
}


// Middleware para obtener eventos
function getEventos(req, res, next) {
    const { fecha, tipo, ubicacion, capacidad } = req.query;
    let sql = 'SELECT * FROM eventos WHERE 1=1';
    const params = [];

    if (fecha) {
        sql += ' AND DATE(fecha) = ?';
        params.push(fecha);
    }
    if (tipo) {
        sql += ' AND tipo LIKE ?';
        params.push(`%${tipo}%`);
    }
    if (ubicacion) {
        sql += ' AND ubicacion LIKE ?';
        params.push(`%${ubicacion}%`);
    }
    if (capacidad) {
        sql += ' AND capacidad_maxima >= ?';
        params.push(capacidad);
    }

    pool.getConnection((err, connection) => {
        if (err) {
            return next(err);
        }
        connection.query(sql, params, (err, rows) => {
            connection.release();
            if (err) {
                return next(err);
            }
            req.eventos = rows;
            next();
        });
    });
}

// Obtener eventos y enviarlos al dashboard
app.post('/eventos', requireAuth, getEventos, (req, res) => {
    res.status(200).json(req.eventos);
});

// Navegación a la página de dashboard con eventos
app.get('/dashboard', requireAuth, getEventos, (req, res) => {
    res.render('dashboard', { user: req.session.user, eventos: req.eventos });
});
app.get('/dashboard/filter', requireAuth, getEventos, (req, res) => {
    res.status(200).json(req.eventos);
});
function getEventosPersonales(req, res, next) {
    if (req.session.user.rol === 'participante') {
        getEventosParticipante(req, res, next);
    } else {
        getEventosOrganizador(req, res, next);
    }
}

function getEventosParticipante(req, res, next) {
    const sql = 'SELECT * FROM eventos WHERE id IN (SELECT evento_id FROM inscripciones WHERE usuario_id=?)';
    pool.getConnection((err, connection) => {
        if (err) {
            return next(err);
        }
        connection.query(sql, [req.session.user.id], (err, rows) => {
            connection.release();
            if (err) {
                return next(err);
            }
            req.eventos = rows;
            next();
        });
    });
}

function getEventosOrganizador(req, res, next) {
    const sql = 'SELECT * FROM eventos WHERE organizador_id=?';
    pool.getConnection((err, connection) => {
        if (err) {
            return next(err);
        }
        connection.query(sql, [req.session.user.id], (err, rows) => {
            connection.release();
            if (err) {
                return next(err);
            }
            req.eventos = rows;
            next();
        });
    });
}

app.get('/usuario:id', requireAuth, getEventosPersonales, (req, res) => {
    res.render('usuario', { user: req.session.user, eventos: req.eventos });
});

//Navegacion a la pagina de error 404
app.use((req,res)=>{
    res.status(404);
    res.render("error404", {url:req.url});
})
app.listen(PORT,(err)=>{
    if(err)
        console.error(`Error al iniciar el servidor: ${err}`);
    else
        console.log(`server listening on port http://localhost:${PORT}`);
});