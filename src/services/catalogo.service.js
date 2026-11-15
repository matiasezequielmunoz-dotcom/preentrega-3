const { QueryTypes } = require('sequelize');
const {
  Actor,
  Categoria,
  Contenido,
  ContenidoActor,
  ContenidoGenero,
  Genero,
  sequelize,
} = require('../models');

const viewColumns = [
  '`id`',
  '`titulo`',
  '`categoria`',
  '`genero`',
  '`sinopsis`',
  '`temporadas`',
  '`reparto`',
  '`trailer`',
].join(', ');

const editableFields = [
  'titulo',
  'categoria',
  'genero',
  'sinopsis',
  'temporadas',
  'reparto',
  'trailer',
];

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function requiredText(value, field, maxLength) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw badRequest(`El campo "${field}" debe ser un texto no vacío.`);
  }

  const text = value.trim();
  if (maxLength && text.length > maxLength) {
    throw badRequest(`El campo "${field}" no puede superar ${maxLength} caracteres.`);
  }

  return text;
}

function splitNames(value, field, maxLength) {
  const names = requiredText(value, field)
    .split(',')
    .map((name) => name.trim());

  if (names.some((name) => name === '')) {
    throw badRequest(`El campo "${field}" contiene un elemento vacío.`);
  }

  const uniqueNames = new Map();
  for (const name of names) {
    if (name.length > maxLength) {
      throw badRequest(`Cada elemento de "${field}" debe tener como máximo ${maxLength} caracteres.`);
    }

    const key = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es');
    if (!uniqueNames.has(key)) {
      uniqueNames.set(key, name);
    }
  }

  return [...uniqueNames.values()];
}

function normalizeContent(input, expectedId) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw badRequest('El cuerpo de la solicitud debe ser un objeto JSON.');
  }

  const allowedFields = new Set([...editableFields, 'id']);
  const unknownFields = Object.keys(input).filter((field) => !allowedFields.has(field));
  if (unknownFields.length > 0) {
    throw badRequest(`Campo(s) no permitido(s): ${unknownFields.join(', ')}.`);
  }

  if (expectedId === undefined && input.id !== undefined) {
    throw badRequest('No envíes "id" al crear un contenido; se genera automáticamente.');
  }
  if (expectedId !== undefined && input.id !== undefined && Number(input.id) !== expectedId) {
    throw badRequest('El "id" del cuerpo debe coincidir con el de la URL.');
  }

  for (const field of editableFields.filter((name) => name !== 'trailer')) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) {
      throw badRequest(`Falta el campo obligatorio "${field}".`);
    }
  }

  const noSeasons =
    typeof input.temporadas === 'string' && input.temporadas.trim() === 'N/A';
  if (
    !noSeasons &&
    (!Number.isSafeInteger(input.temporadas) ||
      input.temporadas < 1 ||
      input.temporadas > 2147483647)
  ) {
    throw badRequest('"temporadas" debe ser un entero positivo o "N/A".');
  }
  const temporadas = noSeasons ? null : input.temporadas;

  let trailer = null;
  if (input.trailer !== undefined && input.trailer !== null) {
    if (typeof input.trailer !== 'string') {
      throw badRequest('"trailer" debe ser un texto o null.');
    }
    trailer = input.trailer.trim() || null;
    if (trailer && trailer.length > 500) {
      throw badRequest('"trailer" no puede superar 500 caracteres.');
    }
  }

  const sinopsis = requiredText(input.sinopsis, 'sinopsis');
  if (Buffer.byteLength(sinopsis, 'utf8') > 65535) {
    throw badRequest('"sinopsis" supera el tamaño máximo permitido.');
  }

  return {
    titulo: requiredText(input.titulo, 'titulo', 150),
    categoria: requiredText(input.categoria, 'categoria', 50),
    generos: splitNames(input.genero, 'genero', 80),
    sinopsis,
    temporadas,
    actores: splitNames(input.reparto, 'reparto', 150),
    trailer,
  };
}

function toTrailerflixShape(row) {
  const contenido = {
    id: Number(row.id),
    titulo: row.titulo,
    categoria: row.categoria,
    genero: row.genero,
    sinopsis: row.sinopsis,
    temporadas: row.temporadas === null ? 'N/A' : Number(row.temporadas),
    reparto: row.reparto,
  };

  if (row.trailer !== null && row.trailer !== undefined) {
    contenido.trailer = row.trailer;
  }

  return contenido;
}

async function queryCatalogo(where = '', replacements = {}) {
  const rows = await sequelize.query(
    `SELECT ${viewColumns} FROM \`vista_trailerflix\` ${where} ORDER BY \`id\``,
    {
      replacements,
      type: QueryTypes.SELECT,
    },
  );

  return rows.map(toTrailerflixShape);
}

async function findOrCreateNamed(Model, nombre, transaction) {
  const [entity] = await Model.findOrCreate({
    where: { nombre },
    defaults: { nombre },
    transaction,
  });
  return entity;
}

async function saveAssociations(contentId, content, transaction) {
  for (const [index, nombre] of content.generos.entries()) {
    const genero = await findOrCreateNamed(Genero, nombre, transaction);
    await ContenidoGenero.create(
      {
        id_contenido: contentId,
        id_genero: genero.id_genero,
        orden: index + 1,
      },
      { transaction },
    );
  }

  for (const [index, nombre] of content.actores.entries()) {
    const actor = await findOrCreateNamed(Actor, nombre, transaction);
    await ContenidoActor.create(
      {
        id_contenido: contentId,
        id_actor: actor.id_actor,
        orden: index + 1,
      },
      { transaction },
    );
  }
}

function getCatalogo() {
  return queryCatalogo();
}

async function getByTitle(titulo) {
  const [contenido] = await queryCatalogo('WHERE `titulo` = :titulo', { titulo });
  return contenido || null;
}

function getByCategory(categoria) {
  return queryCatalogo('WHERE `categoria` = :categoria', { categoria });
}

function getByActor(actor) {
  return queryCatalogo(
    `WHERE \`id\` IN (
      SELECT ca.\`id_contenido\`
      FROM \`contenido_actores\` AS ca
      JOIN \`actores\` AS a ON a.\`id_actor\` = ca.\`id_actor\`
      WHERE a.\`nombre\` = :actor
    )`,
    { actor },
  );
}

async function getById(id) {
  const [contenido] = await queryCatalogo('WHERE `id` = :id', { id });
  return contenido || null;
}

async function createContenido(input) {
  const content = normalizeContent(input);
  const contentId = await sequelize.transaction(async (transaction) => {
    const categoria = await findOrCreateNamed(Categoria, content.categoria, transaction);
    const created = await Contenido.create(
      {
        titulo: content.titulo,
        sinopsis: content.sinopsis,
        temporadas: content.temporadas,
        trailer: content.trailer,
        id_categoria: categoria.id_categoria,
      },
      { transaction },
    );

    await saveAssociations(created.id_contenido, content, transaction);
    return created.id_contenido;
  });

  return getById(contentId);
}

async function updateContenido(id, input) {
  const content = normalizeContent(input, id);
  const updatedId = await sequelize.transaction(async (transaction) => {
    const existing = await Contenido.findByPk(id, { transaction });
    if (!existing) {
      return null;
    }

    const categoria = await findOrCreateNamed(Categoria, content.categoria, transaction);
    await existing.update(
      {
        titulo: content.titulo,
        sinopsis: content.sinopsis,
        temporadas: content.temporadas,
        trailer: content.trailer,
        id_categoria: categoria.id_categoria,
      },
      { transaction },
    );

    await ContenidoGenero.destroy({
      where: { id_contenido: id },
      transaction,
    });
    await ContenidoActor.destroy({
      where: { id_contenido: id },
      transaction,
    });
    await saveAssociations(id, content, transaction);
    return id;
  });

  return updatedId === null ? null : getById(updatedId);
}

async function deleteContenido(id) {
  return sequelize.transaction(async (transaction) => {
    const contenido = await Contenido.findByPk(id, { transaction });
    if (!contenido) {
      return false;
    }

    await ContenidoGenero.destroy({
      where: { id_contenido: id },
      transaction,
    });
    await ContenidoActor.destroy({
      where: { id_contenido: id },
      transaction,
    });
    await contenido.destroy({ transaction });
    return true;
  });
}

module.exports = {
  getCatalogo,
  getByTitle,
  getByCategory,
  getByActor,
  getById,
  createContenido,
  updateContenido,
  deleteContenido,
};
