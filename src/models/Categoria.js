const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Categoria = sequelize.define(
  'Categoria',
  {
    id_categoria: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: 'categorias',
    timestamps: false,
  },
);

module.exports = Categoria;
