const express = require('express');
const app = express();
const db = require('./db'); // Tu conexión a la base de datos
const cors = require('cors');
const bodyParser = require('body-parser');
const Joi = require('joi');

// Middleware para parsear JSON
app.use(bodyParser.json());
app.use(cors());

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Validación de entradas
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  next();
};

// Esquemas de validación
const statSchema = Joi.object({
  id_session: Joi.number().required(),
  nombre: Joi.string().required(),
  valor: Joi.number().required(),
});

const sessionSchema = Joi.object({
  id: Joi.number().required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
});

// Función para ejecutar consultas
const queryDB = (query, params) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
};

// Rutas
app.get('/users', async (req, res, next) => {
  try {
    const results = await queryDB('SELECT * FROM Users');
    res.json(results);
  } catch (err) {
    next(err);
  }
});

app.get('/sessions', async (req, res, next) => {
  try {
    const results = await queryDB('SELECT * FROM Session');
    res.json(results);
  } catch (err) {
    next(err);
  }
});

app.get('/stats/session', async (req, res, next) => {
  const { id_user, id_session, stat_type } = req.body;

  if (!id_user || !id_session || !stat_type) {
    return res.status(400).send('Please provide all required fields: id_user, id_session, stat_type');
  }

  const query = `
    SELECT Stats.*
    FROM Stats
    JOIN User_session ON User_session.id_session = Stats.id_session
    WHERE User_session.id_user = ? AND Stats.id_session = ? AND Stats.nombre = ?;
  `;

  try {
    const results = await queryDB(query, [id_user, id_session, stat_type]);
    if (results.length === 0) {
      return res.status(404).send('No stats found for the given session, user, and stat type');
    }
    res.json(results);
  } catch (err) {
    next(err);
  }
});

app.get('/session/info/:id_session', async (req, res, next) => {
  const { id_session } = req.params;

  const statsQuery = 'SELECT * FROM Stats WHERE id_session = ?';
  const sessionQuery = 'SELECT * FROM Session WHERE id = ?';
  const eventsQuery = 'SELECT * FROM Events WHERE id_session = ?';

  try {
    const [statsResults, sessionResults, eventsResults] = await Promise.all([
      queryDB(statsQuery, [id_session]),
      queryDB(sessionQuery, [id_session]),
      queryDB(eventsQuery, [id_session]),
    ]);

    if (statsResults.length === 0) {
      return res.status(404).send('No stats found for the given session');
    }
    if (sessionResults.length === 0) {
      return res.status(404).send('No session found for the given id');
    }

    const response = {
      stats: statsResults,
      session: sessionResults,
      events: eventsResults,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
});

app.get('/sessions/info', async (req, res, next) => {
  const { ids } = req.query;

  if (!ids) {
    return res.status(400).send('No session IDs provided');
  }

  const id_sessions = ids.split(',').map(id => id.trim());

  if (id_sessions.length > 3) {
    return res.status(400).send('Maximum of 3 session IDs allowed');
  }

  const statsQuery = 'SELECT nombre, momento, valor FROM Stats WHERE id_session = ?';
  const sessionQuery = 'SELECT start_date, end_date FROM Session WHERE id = ?';
  const eventsQuery = 'SELECT type, momento FROM Events WHERE id_session = ?';

  const sessionInfoObject = {};

  try {
    await Promise.all(id_sessions.map(async (id_session) => {
      const [statsResults, sessionResults, eventsResults] = await Promise.all([
        queryDB(statsQuery, [id_session]),
        queryDB(sessionQuery, [id_session]),
        queryDB(eventsQuery, [id_session]),
      ]);

      sessionInfoObject[id_session] = {
        stats: statsResults,
        info: sessionResults[0] || {},
        events: eventsResults,
      };
    }));

    res.json(sessionInfoObject);
  } catch (err) {
    next(err);
  }
});

app.post('/stats', validate(statSchema), async (req, res, next) => {
  const { id_session, nombre, valor } = req.body;

  const query = 'INSERT INTO Stats (id_session, nombre, valor) VALUES (?, ?, ?)';
  try {
    await queryDB(query, [id_session, nombre, valor]);
    res.status(201).send('Stat created successfully');
  } catch (err) {
    next(err);
  }
});

app.post('/sessions', validate(sessionSchema), async (req, res, next) => {
  const { id, start_date, end_date } = req.body;

  const query = 'INSERT INTO Session (id, start_date, end_date) VALUES (?, ?, ?)';
  try {
    await queryDB(query, [id, start_date, end_date]);
    res.status(201).send('Session created successfully');
  } catch (err) {
    next(err);
  }
});

// Iniciar el servidor
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
