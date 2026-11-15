const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const ContenidoGenero = sequelize.define(
  'ContenidoGenero',
  {
    id_contenido: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    id_genero: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    orden: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
  },
  {
    tableName: 'contenido_generos',
    timestamps: false,
  },
);

module.exports = ContenidoGenero;
