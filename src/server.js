const express = require('express');
const app = express();
const db = require('./db'); // Tu conexión a la base de datos
const cors = require('cors');
const bodyParser = require('body-parser');

// Middleware para parsear JSON
app.use(bodyParser.json());
app.use(cors());


/**
 * 1. Obtener todos los usuarios (GET /users)
 */
app.get('/users', (req, res) => {
    console.log("Selecting usres")
  db.query('SELECT * FROM Users', (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(results);
  });
});

/**
 * 2. Obtener todas las sesiones (GET /sessions)
 */
app.get('/sessions', (req, res) => {
  db.query('SELECT * FROM Session', (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(results);
  });
});

/**
 * 3. Obtener todas las estadísticas de una sesión para un usuario y un tipo de estadística (POST /stats)
 *    Se recibe todo en el cuerpo de la solicitud: id_user, id_session, stat_type
 */
app.get('/stats/session', (req, res) => {
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
  console.log("The query " + query)
  db.query(query, [id_user, id_session, stat_type], (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (results.length === 0) {
      return res.status(404).send('No stats found for the given session, user, and stat type');
    }
    res.json(results);
  });
});

/**
 * Obtener las stats, la info y los eventos de una sesion, ejemplo de llamada /session/info/1
 */
app.get('/session/info/:id_session', (req, res) => {
  const { id_session } = req.params;

  // Consultas
  const statsQuery = 'SELECT * FROM Stats WHERE id_session = ?';
  const sessionQuery = 'SELECT * FROM Session WHERE id = ?';
  const eventsQuery = 'SELECT * FROM Events WHERE id_session = ?';
  console.log("Getting session info")

  // Realiza la consulta para obtener la información de "Stats"
  db.query(statsQuery, [id_session], (err, statsResults) => {
      if (err) {
          return res.status(500).send(err);
      }
      if (statsResults.length === 0) {
          return res.status(404).send('No stats found for the given session');
      }

      // Realiza la consulta para obtener la información de la "Session"
      db.query(sessionQuery, [id_session], (err, sessionResults) => {
          if (err) {
              return res.status(500).send(err);
          }
          if (sessionResults.length === 0) {
              return res.status(404).send('No session found for the given id');
          }

          // Realiza la consulta para obtener los "Events" relacionados con la sesión
          db.query(eventsQuery, [id_session], (err, eventsResults) => {
              if (err) {
                  return res.status(500).send(err);
              }

              // Combina los resultados de las tres consultas en un solo objeto de respuesta
              const response = {
                  stats: statsResults,       // Información de Stats
                  session: sessionResults,   // Información de la sesión
                  events: eventsResults         // Lista de eventos
              };

              // Envía la respuesta combinada
              res.json(response);
          });
      });
  });
});

/**
 * Obtener las stats, la info y los eventos de una dos o tres sesiones /sessions/info?ids=1,2,3 
 * 
 * devuelve objeto con clave id de la sesion y con {stats, info, events }
 *  
 * eg. para la llamada /sessions/info?ids=1,2,3 devuelve
 * 
 * {
    "1": {
        "stats":[
            {
                "nombre": "MOV_HAND_LEFT",
                "momento": "2023-10-12T08:00:00.000Z",
                "valor": 4.9
            },
            {
                "nombre": "MOV_HAND_LEFT",
                "momento": "2023-10-12T08:00:30.000Z",
                "valor": 1.1
            },
            ....
            ],
        "info": {
            "start_date": "2023-10-12T08:00:00.000Z",
            "end_date": "2023-10-12T08:20:00.000Z"
        },
        "events": [
            {
                "type": "TALK",
                "momento": "2023-10-12T08:10:00.000Z"
            },
            {
                "type": "INSULT",
                "momento": "2023-10-12T08:12:45.000Z"
            },
            ...
      ]
    },
    "2": {
        "stats":[...], "info" : {...}, "events":[...]
    },
    "3": {
        "stats":[...], "info" : {...}, "events":[...]
    },
 * 
 */

app.get('/sessions/info', (req, res) => {
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

  const sessionInfoObject = {};  // Usamos un objeto en lugar de un array
  console.log("Getting session info of multiple sessions")

  const getSessionInfo = (id_session, callback) => {
      db.query(statsQuery, [id_session], (err, statsResults) => {
          if (err) {
              return callback(err);
          }

          db.query(sessionQuery, [id_session], (err, sessionResults) => {
              if (err) {
                  return callback(err);
              }

              db.query(eventsQuery, [id_session], (err, eventsResults) => {
                  if (err) {
                      return callback(err);
                  }

                  // Construimos el objeto con la información de la sesión
                  const sessionInfo = {
                      stats: statsResults,
                      info: sessionResults[0] || {},  // La sesión será un objeto único
                      events: eventsResults
                  };

                  callback(null, sessionInfo);
              });
          });
      });
  };

  let completedRequests = 0;
  id_sessions.forEach((id_session) => {
      getSessionInfo(id_session, (err, sessionInfo) => {
          if (err) {
              return res.status(500).send(err);
          }

          // Usamos el id_session como clave del objeto
          sessionInfoObject[id_session] = sessionInfo;
          completedRequests++;

          // Una vez que hemos procesado todas las sesiones, devolvemos el resultado
          if (completedRequests === id_sessions.length) {
              res.json(sessionInfoObject);  // Enviamos el objeto con las claves por id_session
          }
      });
  });
});




/**
 * 4. Insertar una nueva estadística para una sesión (POST /stats)
 */
app.post('/stats', (req, res) => {
  const { id_session, nombre, valor } = req.body;

  if (!id_session || !nombre || !valor) {
    return res.status(400).send('Please provide all required fields: id_session, nombre, valor');
  }

  const query = 'INSERT INTO Stats (id_session, nombre, valor) VALUES (?, ?, ?)';
  db.query(query, [id_session, nombre, valor], (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(201).send('Stat created successfully');
  });
});

/**
 * 5. Insertar una nueva sesión (POST /sessions)
 */
app.post('/sessions', (req, res) => {
  const { id, start_date, end_date } = req.body;

  if (!id || !start_date || !end_date) {
    return res.status(400).send('Please provide all required fields: id, start_date, end_date');
  }

  const query = 'INSERT INTO Session (id, start_date, end_date) VALUES (?, ?, ?)';
  db.query(query, [id, start_date, end_date], (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(201).send('Session created successfully');
  });
});

// Iniciar el servidor
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
