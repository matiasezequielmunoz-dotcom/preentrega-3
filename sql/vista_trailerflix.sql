USE `trailerflix`;

CREATE OR REPLACE VIEW `vista_trailerflix` AS
SELECT
  c.`id_contenido` AS `id`,
  c.`titulo`,
  cat.`nombre` AS `categoria`,
  COALESCE(
    (
      SELECT GROUP_CONCAT(g.`nombre` ORDER BY cg.`orden` SEPARATOR ', ')
      FROM `contenido_generos` AS cg
      JOIN `generos` AS g ON g.`id_genero` = cg.`id_genero`
      WHERE cg.`id_contenido` = c.`id_contenido`
    ),
    ''
  ) AS `genero`,
  c.`sinopsis`,
  c.`temporadas`,
  COALESCE(
    (
      SELECT GROUP_CONCAT(a.`nombre` ORDER BY ca.`orden` SEPARATOR ', ')
      FROM `contenido_actores` AS ca
      JOIN `actores` AS a ON a.`id_actor` = ca.`id_actor`
      WHERE ca.`id_contenido` = c.`id_contenido`
    ),
    ''
  ) AS `reparto`,
  c.`trailer`
FROM `contenidos` AS c
JOIN `categorias` AS cat ON cat.`id_categoria` = c.`id_categoria`;
