const express = require('express');
const { sequelize } = require('./models');
const routes = require('./routes');

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());

app.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

app.use(routes);

app.use((_request, response) => {
  response.status(404).json({ error: 'Ruta no encontrada.' });
});

app.use((error, _request, response, _next) => {
  if (error.statusCode === 400) {
    return response.status(400).json({ error: error.message });
  }
  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ error: 'El cuerpo JSON no es válido.' });
  }

  console.error('Error al procesar la solicitud:', error);
  response.status(500).json({ error: 'Error interno del servidor.' });
});

let server;
let shuttingDown = false;

async function closeConnection() {
  try {
    await sequelize.close();
    console.log('Conexion a MySQL cerrada correctamente.');
  } catch (error) {
    console.error('Error al cerrar la conexion a MySQL:', error);
    process.exitCode = 1;
  }
}

async function shutdown() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (!server) {
    await closeConnection();
    return;
  }

  server.close(async (error) => {
    if (error) {
      console.error('Error al cerrar el servidor HTTP:', error);
      process.exitCode = 1;
    }

    await closeConnection();
  });
}

async function startServer() {
  await sequelize.authenticate();
  console.log('Conexion a MySQL establecida correctamente.');

  server = app.listen(port, () => {
    console.log(`API Trailerflix escuchando en http://localhost:${port}`);
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

startServer().catch(async (error) => {
  console.error('No se pudo iniciar la API o conectar con MySQL:', error);
  await closeConnection();
  process.exitCode = 1;
});
