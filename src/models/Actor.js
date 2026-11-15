const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Actor = sequelize.define(
  'Actor',
  {
    id_actor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
  },
  {
    tableName: 'actores',
    timestamps: false,
  },
);

module.exports = Actor;
