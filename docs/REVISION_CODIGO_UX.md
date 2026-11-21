# Revisión de código, UX y accesibilidad — Oráculo Taoísta v1.3.0

Alcance: `src/main.jsx`, `index.html` (CSS), `ProfileCard.css`, `public/sw.js`, `vite.config.js`, repo. Estándar: WCAG 2.2 AA. Método: lectura de código, cálculo de contraste y prueba en Chromium (390×800, tres temas). No se probó con lector de pantalla real ni con usuarios.

## Corregido en esta revisión
| # | Hallazgo | Severidad | Evidencia | Arreglo |
|---|---|---|---|---|
| 1 | `node_modules/` (11 158 archivos) y `.env` estaban versionados; no había `.gitignore` | Alta (higiene/seguridad) | `git ls-files` | `.gitignore`, `.env.example`, archivos fuera del índice |
| 2 | Anillo de foco con `--ritual-pink`: 2,09:1 en tema claro y 2,82:1 en sumi-e (mínimo 3:1, WCAG 1.4.11) | Alta | Contraste calculado | Foco con `--accent-text` (6,4–8,9:1); verificado en navegador |
| 3 | Texto en hover con `--ritual-pink` (2,09:1 en claro) | Media | Contraste calculado | `--accent-text` |
| 4 | Menú cerrado solo en `opacity:0`: 7 botones seguían en el árbol de accesibilidad | Media (4.1.2) | CSS | `visibility:hidden` al cerrar; verificado |
| 5 | `<label>` sin control en la carta; logo decorativo repetido con `alt` largo | Media/Baja (1.3.1, 1.1.1) | JSX | `<span>`; `alt=""` |
| 6 | Barra espaciadora en la tarjeta "Desvelar" desplazaba la página | Baja | JSX | `preventDefault` |
| 7 | Avisos de 4 s fijos aunque el texto sea largo (2.2.1); `✧` leído por lectores | Baja | JSX | Duración según longitud; `aria-hidden` |
| 8 | Botón de tema sin indicar el tema actual | Baja (Nielsen 1) | JSX | Etiqueta con tema actual |
| 9 | Favoritos guardados contenían cartas ya retiradas del dataset (incluidas de autores excluidos) y textos viejos | Media | Código + prueba | Sincronización al arrancar con aviso |

## Pendiente (decisión tuya)
| # | Hallazgo | Severidad | Sugerencia |
|---|---|---|---|
| A | `public/sw.js` es código muerto: el build genera `dist/sw.js` con Workbox y lo sobrescribe; la versión manual (`CACHE_VERSION`) engaña | Media | Eliminarlo o dejar un solo mecanismo |
| B | `dist/` está versionado | Baja | Valorar construirlo en CI/Cloudflare |
| C | Cuatro puntos de donación: línea dentro de ~30 % de las cartas, invitación cada 5 cartas, botón del menú y modal de info | Media (UX/ética) | Dejar uno o dos; ninguno dentro de la carta |
| D | Copy del modal "Protocolo Erudito": "Cosmología Visual de la Reflexión", "tiene consecuencias" es vago y grandilocuente | Baja | Reescribir con datos concretos (qué es, cuántas cartas, fuentes) |
| E | Íconos del menú ambiguos (el tema oscuro usa un ojo; el claro, una luna) | Baja (Nielsen 2) | Íconos acordes (sol/luna/pincel) |
| F | `ElectricBorder` calcula ruido de 10 octavas por punto y cuadro: coste alto en móviles gama baja antes de revelar | Media | Medir; bajar octavas o frecuencia |
| G | La carta del día cambia para todos tras la depuración (índice por hash módulo tamaño del mazo) | Informativa | Esperado; avisar si importa la continuidad |
| H | La fecha ("Sincronía · …") se calcula una vez; si la app queda abierta tras medianoche no se actualiza | Baja | Recalcular en `visibilitychange` |
| I | Sin pruebas automatizadas de la app (solo el validador del dataset) | Media | Añadir humo con Playwright (hay un guion de ejemplo en la revisión) |

## Lo que está bien
Modales con `role="dialog"`, `aria-modal`, trampa y retorno de foco y Escape; respeto de `prefers-reduced-motion` (CSS y WebGL); objetivos táctiles de 44–52 px; contraste de texto correcto en los tres temas salvo el caso marginal `--ink-muted` sobre `--bg-secondary` en tema claro (4,50:1, en el límite); acciones de arrastre con alternativa en botón; exportar/importar Codex; degradación segura cuando `localStorage` falla; pausa del render al ocultar la pestaña.

## Capas revisadas (orden del skill de UI)
1 Contexto y tarea: revisado (PWA de uso diario, móvil primero) · 2 Flujo y estructura: revisado · 3 Composición, formularios y lenguaje: revisado (solo un campo de búsqueda; copy parcial) · 4 Accesibilidad WCAG 2.2 AA: revisado por código y contraste, **no** con lector de pantalla · 5 Pase visual: revisado en captura del tema oscuro; claro y sumi-e solo por tokens · 6 Huellas de IA: revisado (copy del modal, "✧" decorativo; sin degradados morados dominantes) · 7 Validación con usuarios: no revisado.

## Tres cambios de mayor impacto
1. Sacar `node_modules`/`.env` del repo (hecho).
2. Foco visible con contraste suficiente en los tres temas (hecho).
3. Reducir los puntos de donación y retirarlos de la carta (pendiente).
