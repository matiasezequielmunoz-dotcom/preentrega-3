const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const ContenidoActor = sequelize.define(
  'ContenidoActor',
  {
    id_contenido: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    id_actor: {
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
    tableName: 'contenido_actores',
    timestamps: false,
  },
);

module.exports = ContenidoActor;
