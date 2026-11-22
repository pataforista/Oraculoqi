# Decisiones de curaduría

## Duplicados (se conserva la versión más cercana al texto clásico)
| Eliminada | Se conserva | Motivo |
|---|---|---|
| TAO_0451 | TAO_0452 | Misma frase; 0452 tiene fuente: *Wumenguan* caso 37 (Zhaozhou, «庭前柏树子»). |
| TAO_0568 | TAO_0137 | Mismo caso (*Wumenguan* 7, «lava tu cuenco»). 0137 es la forma más fiel; recibe la interpretación y práctica de 0568. Linaje → zen. |
| TAO_0196 | TAO_0126 | Mismo pasaje (*Zhuangzi* cap. 2, el sueño de la mariposa). 0126 pasa a linaje taoismo, categoría `identidad` y cita a Zhuangzi (antes citaba ACT, que no corresponde). |

Criterio: las colecciones de koans (*Wumenguan*, *Biyan Lu*) fijan un caso por entrada; las variantes posteriores son comentarios, no casos distintos.

## Categorías unificadas (nombres de procesos ACT; Hayes, Strosahl & Wilson, 2012)
`self_como_contexto`, `observador` → `yo_contexto` · `direccion` → `valores` · `accion` → `accion_comprometida` · `lenguaje` → `lenguaje_y_realidad`.
No se unificaron `asimetria`, `ontologia`, `continuidad`, `control`, `evitacion_experiencial`, `autocuidado` ni `energia`: son nociones distintas, no sinónimos.

## Linaje "zen"
No se añadieron valores al catálogo (rompería filtros y el catálogo canónico). La distinción entre texto clásico y formulación moderna vive en `nota_editorial`: fuente concreta si es clásico, «Creación original (sin fuente)» si es construcción en estilo zen.

## Verificación
`npm run validate` corre en modo estricto (0 errores, 0 advertencias). `npm run validate:lenient` degrada los errores editoriales a advertencias; `validate:report` genera el JSON.
