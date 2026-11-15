const express = require('express');
const catalogoRoutes = require('./catalogo.routes');

const router = express.Router();

router.use(catalogoRoutes);

module.exports = router;
