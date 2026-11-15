const path = require('node:path');
const { Sequelize } = require('sequelize');

require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env'),
});

const requiredVariables = ['DB_NAME', 'DB_USER', 'DB_HOST'];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length > 0) {
  throw new Error(
    `Faltan variables de entorno requeridas: ${missingVariables.join(', ')}. ` +
      'Copiá .env.example a .env y completá la configuración.',
  );
}

const port = Number(process.env.DB_PORT || 3306);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT debe ser un puerto válido entre 1 y 65535.');
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST,
    port,
    dialect: 'mysql',
    logging: false,
  },
);

module.exports = sequelize;
