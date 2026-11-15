const express = require('express');
const catalogoService = require('../services/catalogo.service');

const router = express.Router();

function parsePositiveId(value) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

router.get('/catalogo', async (_request, response) => {
  response.json(await catalogoService.getCatalogo());
});

router.get('/catalogo/:id', async (request, response) => {
  const id = parsePositiveId(request.params.id);
  if (id === null) {
    return response.status(400).json({ error: 'El id debe ser un entero positivo.' });
  }

  const contenido = await catalogoService.getById(id);
  if (!contenido) {
    return response.status(404).json({ error: 'Contenido no encontrado.' });
  }

  response.json(contenido);
});

router.post('/catalogo', async (request, response) => {
  const contenido = await catalogoService.createContenido(request.body);
  response.status(201).json(contenido);
});

router.put('/catalogo/:id', async (request, response) => {
  const id = parsePositiveId(request.params.id);
  if (id === null) {
    return response.status(400).json({ error: 'El id debe ser un entero positivo.' });
  }

  const contenido = await catalogoService.updateContenido(id, request.body);
  if (!contenido) {
    return response.status(404).json({ error: 'Contenido no encontrado.' });
  }

  response.json(contenido);
});

router.delete('/catalogo/:id', async (request, response) => {
  const id = parsePositiveId(request.params.id);
  if (id === null) {
    return response.status(400).json({ error: 'El id debe ser un entero positivo.' });
  }

  const deleted = await catalogoService.deleteContenido(id);
  if (!deleted) {
    return response.status(404).json({ error: 'Contenido no encontrado.' });
  }

  response.status(204).end();
});

router.get('/titulo/:titulo', async (request, response) => {
  const contenido = await catalogoService.getByTitle(request.params.titulo);

  if (!contenido) {
    return response.status(404).json({ error: 'Contenido no encontrado.' });
  }

  response.json(contenido);
});

router.get('/categoria/:categoria', async (request, response) => {
  response.json(await catalogoService.getByCategory(request.params.categoria));
});

router.get('/reparto/:actor', async (request, response) => {
  response.json(await catalogoService.getByActor(request.params.actor));
});

router.get('/trailer/:id', async (request, response) => {
  const id = parsePositiveId(request.params.id);
  if (id === null) {
    return response.status(400).json({ error: 'El id debe ser un entero positivo.' });
  }

  const contenido = await catalogoService.getById(id);
  if (!contenido) {
    return response.status(404).json({ error: 'Contenido no encontrado.' });
  }
  if (!contenido.trailer) {
    return response.status(404).json({ error: 'El contenido no tiene un trailer disponible.' });
  }

  response.json({ id: contenido.id, trailer: contenido.trailer });
});

module.exports = router;
