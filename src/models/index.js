const sequelize = require('../database');
const Actor = require('./Actor');
const Categoria = require('./Categoria');
const Contenido = require('./Contenido');
const ContenidoActor = require('./ContenidoActor');
const ContenidoGenero = require('./ContenidoGenero');
const Genero = require('./Genero');

Contenido.belongsTo(Categoria, {
  foreignKey: 'id_categoria',
  as: 'categoria',
});
Categoria.hasMany(Contenido, {
  foreignKey: 'id_categoria',
  as: 'contenidos',
});

Contenido.belongsToMany(Genero, {
  through: ContenidoGenero,
  foreignKey: 'id_contenido',
  otherKey: 'id_genero',
  as: 'generos',
});
Genero.belongsToMany(Contenido, {
  through: ContenidoGenero,
  foreignKey: 'id_genero',
  otherKey: 'id_contenido',
  as: 'contenidos',
});

Contenido.belongsToMany(Actor, {
  through: ContenidoActor,
  foreignKey: 'id_contenido',
  otherKey: 'id_actor',
  as: 'actores',
});
Actor.belongsToMany(Contenido, {
  through: ContenidoActor,
  foreignKey: 'id_actor',
  otherKey: 'id_contenido',
  as: 'contenidos',
});

module.exports = {
  sequelize,
  Actor,
  Categoria,
  Contenido,
  ContenidoActor,
  ContenidoGenero,
  Genero,
};
