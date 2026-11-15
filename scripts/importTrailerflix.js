const fs = require('node:fs');
const path = require('node:path');
const {
  Actor,
  Categoria,
  Contenido,
  ContenidoActor,
  ContenidoGenero,
  Genero,
  sequelize,
} = require('../src/models');

const sourcePath = path.resolve(__dirname, '..', 'trailerflix.json');
const tables = [
  ['contenidos', Contenido],
  ['categorias', Categoria],
  ['generos', Genero],
  ['actores', Actor],
  ['contenido_generos', ContenidoGenero],
  ['contenido_actores', ContenidoActor],
];

function requiredText(value, field, contentId) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`El contenido ${contentId} no tiene un valor valido en ${field}.`);
  }

  return value.trim();
}

function splitList(value, field, contentId) {
  const names = requiredText(value, field, contentId)
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  return [...new Set(names)];
}

function normalizeSeasons(value, contentId) {
  if (value === 'N/A') {
    return null;
  }

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`El contenido ${contentId} tiene un valor invalido en temporadas.`);
  }

  return value;
}

async function ensureEmptyDatabase() {
  const populatedTables = [];

  for (const [tableName, Model] of tables) {
    if ((await Model.count()) > 0) {
      populatedTables.push(tableName);
    }
  }

  if (populatedTables.length > 0) {
    throw new Error(
      `No se importaron datos porque estas tablas ya tienen registros: ${populatedTables.join(', ')}.`,
    );
  }
}

async function importTrailerflix(records) {
  const categoryIds = new Map();
  const genreIds = new Map();
  const actorIds = new Map();
  const seenContentIds = new Set();

  await sequelize.transaction(async (transaction) => {
    for (const record of records) {
      if (!Number.isInteger(record.id) || seenContentIds.has(record.id)) {
        throw new Error(`El ID de contenido ${record.id} no es valido o esta repetido.`);
      }

      seenContentIds.add(record.id);

      const categoryName = requiredText(record.categoria, 'categoria', record.id);
      if (!categoryIds.has(categoryName)) {
        const category = await Categoria.create(
          { nombre: categoryName },
          { transaction },
        );
        categoryIds.set(categoryName, category.id_categoria);
      }

      await Contenido.create(
        {
          id_contenido: record.id,
          titulo: requiredText(record.titulo, 'titulo', record.id),
          sinopsis: requiredText(record.sinopsis, 'sinopsis', record.id),
          temporadas: normalizeSeasons(record.temporadas, record.id),
          trailer: record.trailer || null,
          id_categoria: categoryIds.get(categoryName),
        },
        { transaction },
      );

      const genreNames = splitList(record.genero, 'genero', record.id);
      for (const [index, genreName] of genreNames.entries()) {
        if (!genreIds.has(genreName)) {
          const genre = await Genero.create(
            { nombre: genreName },
            { transaction },
          );
          genreIds.set(genreName, genre.id_genero);
        }

        await ContenidoGenero.create(
          {
            id_contenido: record.id,
            id_genero: genreIds.get(genreName),
            orden: index + 1,
          },
          { transaction },
        );
      }

      const actorNames = splitList(record.reparto, 'reparto', record.id);
      for (const [index, actorName] of actorNames.entries()) {
        if (!actorIds.has(actorName)) {
          const actor = await Actor.create(
            { nombre: actorName },
            { transaction },
          );
          actorIds.set(actorName, actor.id_actor);
        }

        await ContenidoActor.create(
          {
            id_contenido: record.id,
            id_actor: actorIds.get(actorName),
            orden: index + 1,
          },
          { transaction },
        );
      }
    }
  });

  return {
    contents: seenContentIds.size,
    categories: categoryIds.size,
    genres: genreIds.size,
    actors: actorIds.size,
  };
}

async function main() {
  try {
    const records = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('trailerflix.json debe contener un arreglo no vacio.');
    }

    await sequelize.authenticate();
    await ensureEmptyDatabase();
    const imported = await importTrailerflix(records);

    console.log(
      `Importacion completa: ${imported.contents} contenidos, ` +
        `${imported.categories} categorias, ${imported.genres} generos y ` +
        `${imported.actors} actores.`,
    );
  } catch (error) {
    console.error('No se pudo importar trailerflix.json:', error);
    process.exitCode = 1;
  } finally {
    try {
      await sequelize.close();
    } catch (error) {
      console.error('No se pudo cerrar la conexion a MySQL:', error);
      process.exitCode = 1;
    }
  }
}

main();
