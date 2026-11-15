const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Contenido = sequelize.define(
  'Contenido',
  {
    id_contenido: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    titulo: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    sinopsis: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    temporadas: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    trailer: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    id_categoria: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'contenidos',
    timestamps: false,
  },
);

module.exports = Contenido;
