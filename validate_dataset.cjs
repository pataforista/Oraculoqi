#!/usr/bin/env node
/**
 * validate_dataset.cjs — Curaduría editorial del dataset taoísta/zen/ACT/estoico.
 * Node >= 18. Sin dependencias.
 *
 * Uso:
 *   node validate_dataset.cjs
 *   node validate_dataset.cjs --file=public/dataset_taoista.js --strict
 *   node validate_dataset.cjs --fix
 *   node validate_dataset.cjs --json=reporte.json --max-warnings=0
 *   node validate_dataset.cjs --list-rules
 *   node validate_dataset.cjs --editorial=warn   (errores editoriales E1xx/E2xx pasan a warning;
 *                                                  los estructurales y de catálogo siguen bloqueando)
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// ───────────────────────────── CLI ─────────────────────────────
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => {
  const a = argv.find((x) => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3) : d;
};

const FILE = opt('file', 'public/dataset_taoista.js');
const FIX = flag('fix');
const STRICT = flag('strict');
const QUIET = flag('quiet');
const JSON_OUT = opt('json', null);
const EDITORIAL_WARN = opt('editorial', 'error') === 'warn';
const CATALOGO = opt('catalog', 'catalogos_canonicos_v1.json');
const MAX_WARN = Number(opt('max-warnings', STRICT ? 0 : Infinity));

// ─────────────────────── CONFIGURACIÓN ─────────────────────────
// Criterio editorial del proyecto.Editable sin tocar la lógica.
const AUTORES_EXCLUIDOS = [
  'osho', 'rajneesh', 'joe dispenza', 'deepak chopra', 'tony robbins',
  'rhonda byrne', 'louise hay', 'napoleon hill', 'norman vincent peale',
  'w. clement stone', 'earl nightingale', 'og mandino', 'brian tracy',
  'roy t. bennett', 'byron pulsifer', 'celestine chua', 'ralph marston',
  'denis waitley', 'james allen', 'dan millman', 'naval ravikant',
];

// Agregadores sin aparato crítico: no son fuente primaria.
const AGREGADORES = ['zenquotes', 'repositorio externo'];

// Referencias textuales que constituyen aparato crítico válido.
const MARCAS_ACADEMICAS = [
  'daodejing', 'dao de jing', 'zhuangzi', 'chuang tzu', 'liezi', 'huainanzi',
  'mumonkan', 'wumenguan', 'biyan', 'shobogenzo', 'linji', 'rinzai', 'zhaozhou',
  'dogen', 'dōgen', 'sutta', 'sutra', 'dhammapada', 'therigatha', 'koan',
  'analectas', 'enquiridión', 'enchiridion', 'meditaciones', 'discursos',
  'discurso', 'epistulae', 'de ira', 'de brevitate', 'hexagrama', 'capítulo',
  'shambhala', 'traducción', 'adaptado de', 'basado en', 'lectura de',
  'lectura no literal', 'stratagems', 'chuandeng', 'genjōkōan', 'genjokoan', 'yijing',
];

const BOILERPLATE = [
  'en el corazón de esta idea yace la verdad',
  'nos invita a observar críticamente',
  'un sabio apunte para reconocer',
  'esta frase ilumina un principio vital',
  'el mensaje central aquí es que',
  'esta máxima sugiere sutilmente',
  'a través de esta perspectiva, vemos que',
  'esta enseñanza nos recuerda que',
  'apunta directamente a la comprensión de que',
  'una profunda reflexión sobre cómo',
  'transformando nuestra relación con los retos que nos rodean',
  'permitiéndonos regresar a nuestro centro emocional con total claridad',
  'abriendo la puerta a una paz interior inquebrantable',
  'rompiendo el ciclo de la reactividad automática',
  'enseñándonos a transitar por la incertidumbre con ligereza y gracia',
  'lo cual constituye la base de una vida realmente significativa',
  "revelando la inmensa belleza de existir en el 'aquí y ahora'",
  'facilitando una conexión más auténtica con nosotros mismos',
  'soltar la necesidad de perfección abre paso a la verdadera excelencia',
  'abrazar lo que no podemos controlar libera una inmensa energía vital',
  'para materializar esto, elige',
  'como un experimento de curiosidad radical',
  'reconociendo que cada pequeño paso cuenta',
  'permítete descansar en la simpleza de ser',
  'notando cómo cambia tu experiencia interna al no luchar',
  'rompiendo así el patrón del piloto automático',
  'para cultivar una mente flexible y abierta',
  'para anclar tu atención en el presente',
  'notar la urgencia por distraerte con el teléfono',
  'transforma esta idea en acción al',
  'en las próximas horas, procura',
  'hoy, te invito a',
];

const NOTAS_GENERICAS = [
  'inspiración contemplativa.', 'inspiración contemplativa',
  'tradición.', 'tradición', 'clásico.', 'clásico', 'metáfora.', 'metáfora',
  'convergencia.', 'convergencia', 'texto clásico.', 'paradoja clásica.',
];

const MASCULINO_GENERICO = [
  /\bel hombre\b/i, /\blos hombres\b/i, /\bun hombre\b/i,
  /\bal hombre\b/i, /\bdel hombre\b/i, /\btodo hombre\b/i,
  /\bel necio\b/i, /\bel sabio\b(?!\s+dijo)/i,
];

const CAPACITISMO = [
  /\bcieg[oa]s?\b/i, /\bsord[oa]s?\b/i, /\bmud[oa]s?\b/i,
  /\bloc[oa]s?\b/i, /\best[uú]pid[oa]s?\b/i, /\bidiota\b/i,
  /\bretrasad[oa]s?\b/i, /\bmanco\b/i, /\bcojo\b/i, /\bdemente\b/i,
  /\besquizofr\w*/i, /\bparal[ií]tic[oa]s?\b/i, /\binv[aá]lid[oa]s?\b/i,
];

const VIOLENCIA = [
  /\bm[aá]tal[oa]s?\b/i, /\bmatar(lo|la|los|las)\b/i, /\bsi (te )?encuentras al buda\b/i,
  /\ble cortaron el dedo\b/i, /\bgolpe[oó] al d/i, /\bquem[oó] la estatua\b/i,
  /\bescupir contra el viento\b/i, /\besconder una daga\b/i,
];

const CULPABILIZANTE = [
  /no culpes a nadie de cómo te sientes/i,
  /la felicidad es una elecci[oó]n/i,
  /si decides estar triste/i,
  /tus [uú]nicas limitaciones son/i,
  /no hay limitaciones para la mente humana/i,
  /si estás deprimido, vives en el pasado/i,
  /responsabilidad total de tu estado mental/i,
];

// Consejos que pueden dañar a una persona vulnerable: aislamiento sin aviso, aguantar dolor,
// invalidar duelo, positividad obligatoria o atribuir enfermedad a la mente.
const RIESGO_CLINICO = [
  /que nadie sepa d[oó]nde/i, /sin quejarte/i, /no llores/i,
  /agradece (una|el|la) (dificultad|dolor|p[eé]rdida)/i, /si tu cuerpo enferma/i,
  /el dolor f[ií]sico .*(trae|despierta)/i, /saldr[aá]s ileso/i, /lo inanimado siente/i,
];

const SOMATICO_EXCLUYENTE = [
  /planta de tus pies/i, /hombros abajo/i, /mand[ií]bula suelta/i,
  /siente tus pies firmes/i, /pies en el suelo/i,
];
const SOMATICO_INCLUSIVO = /punto de apoyo|o tus manos|el asiento|si te resulta|donde tu cuerpo|o donde|si no es accesible|regazo/i;

const LINAJES_FALLBACK = [
  'zen', 'taoismo', 'budismo', 'sufismo', 'estoicismo', 'mindfulness',
  'existencialismo', 'sistemica', 'humanista', 'contemporaneo',
];

// Catálogo canónico (categorías y linajes permitidos). Si no existe, solo se avisa.
function cargarCatalogo() {
  try {
    const j = JSON.parse(fs.readFileSync(CATALOGO, 'utf8'));
    const c = j.catalogos_canonicos;
    return { categoria: new Set(c.categoria), linaje: new Set(c.linaje) };
  } catch (e) {
    console.error(`Aviso: no se pudo leer el catálogo (${CATALOGO}): ${e.message}`);
    return null;
  }
}
const CAT = cargarCatalogo();
const LINAJES_VALIDOS = CAT ? CAT.linaje : new Set(LINAJES_FALLBACK);

// Grupos de categorías que deberían unificarse.
const SINONIMOS_CATEGORIA = [
  // El primer elemento es la forma canónica (nombres de procesos ACT; Hayes et al., 2012).
  ['yo_contexto', 'self_como_contexto', 'observador'],
  ['valores', 'direccion'],
  ['lenguaje_y_realidad', 'lenguaje'],
  ['accion_comprometida', 'accion'],
];

// Coherencia proceso ACT ↔ práctica.
const ACT_KEYWORDS = {
  defusion: ['gracias, mente', 'estoy teniendo el pensamiento', 'etiqueta', 'nota', 'radio', 'hoja', 'comentario', 'observa', 'estoy notando', 'nombra', 'pasajero'],
  accion_comprometida: ['haz', 'da un paso', 'da hoy un paso', 'paso', 'envía', 'llama', 'escribe', 'actúa', 'repetición', 'elige', 'empieza', 'ejecuta', 'decisión', 'convierte', 'camina', 'interrumpe', 'cambia'],
  valores: ['valor', 'dirección', 'rumbo', 'elige', 'brújula', 'acción', 'paso', 'miedo', 'valdría', 'claridad', 'repetición'],
  yo_contexto: ['observa', 'nota', 'espacio', 'testigo', 'sostén', 'contexto', 'ola', 'nube', 'mira', 'repite', 'recuérdate', 'visualiza', 'descríbelo', 'respiración', 'quién', 'dónde', 'pasa en mí', 'deja que', 'tablero', 'etiqueta', 'historia', 'deja pasar', 'intervalo', 'acción', 'cambia', 'elige', 'detecta'],
  aceptacion: ['permite', 'deja', 'nombra', 'sostén', 'invita', 'acepta', 'respira', 'esto es', 'puedo vivir', 'no lo entiendo', 'no busques', 'contacto', 'escribe', 'lista', 'localiza', 'adelante', 'sin intentar'],
  momento_presente: ['nota', 'observa', 'escucha', 'sensa', 'registra', 'aquí', 'bebe', 'cuida', 'nombra', 'atención', 'gesto', 'camina', 'mira'],
};

const CAMPOS_REQ = ['id', 'frase', 'interpretacion', 'practica_hoy', 'categoria', 'linaje', 'nota_editorial'];
const ORDEN = ['id', 'frase', 'interpretacion', 'practica_hoy', 'categoria', 'linaje', 'nota_editorial'];

const LIMITES = { fraseChars: 160, frasePalabras: 26, interpretacion: 300, practica: 240 };

// ───────────────────────── UTILIDADES ──────────────────────────
const norm = (s) => String(s ?? '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const STOP = new Set(('de la el los las un una unos unas y o a en con por para que se su sus al del es son ' +
  'no si lo le les mi tu te me mas más muy como cuando donde quien cual este esta esto ese esa eso').split(' '));

const tokens = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 2 && !STOP.has(w)));

const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let i = 0;
  for (const t of a) if (b.has(t)) i++;
  return i / (a.size + b.size - i);
};

const tieneAparato = (nota) => {
  const n = norm(nota);
  return MARCAS_ACADEMICAS.some((m) => n.includes(norm(m)));
};

// ─────────────────────────── CARGA ─────────────────────────────
function cargar(file) {
  const raw = fs.readFileSync(file, 'utf8');
  // 1) Sandbox: soporta JSON puro y literal JS.
  try {
    const ctx = { window: {} };
    vm.createContext(ctx);
    vm.runInContext(raw, ctx, { timeout: 5000, filename: path.basename(file) });
    if (ctx.window && ctx.window.TAOISTA_DATASET) return { data: ctx.window.TAOISTA_DATASET, raw };
  } catch (_) { /* fallback */ }
  // 2) Fallback: extraer el objeto y parsear como JSON.
  const m = raw.match(/window\.TAOISTA_DATASET\s*=\s*([\s\S]*?);?\s*$/);
  if (!m) throw new Error('No se encontró window.TAOISTA_DATASET.');
  return { data: JSON.parse(m[1]), raw };
}

// ─────────────────────── MOTOR DE REGLAS ───────────────────────
const findings = [];
const add = (level, code, card, field, message, extra = {}) => {
  if (EDITORIAL_WARN && level === 'error' && /^E[12]\d\d$/.test(code)) level = 'warn';
  findings.push({ level, code, id: card?.id ?? '(sin id)', field, message, ...extra });
};

function validar(ds) {
  if (!ds || typeof ds !== 'object') {
    add('error', 'E001', null, null, 'El dataset no es un objeto.');
    return;
  }
  const cards = ds.cards;
  if (!Array.isArray(cards) || cards.length === 0) {
    add('error', 'E001', null, 'cards', 'cards debe ser un array no vacío.');
    return;
  }

  const idsVistos = new Map();
  const frasesVistas = new Map();
  const tokenCache = [];

  cards.forEach((c, idx) => {
    if (!c || typeof c !== 'object') {
      add('error', 'E002', null, `cards[${idx}]`, 'La tarjeta no es un objeto.');
      return;
    }

    // ── Estructura
    for (const k of CAMPOS_REQ) {
      if (!(k in c)) { if (k !== 'nota_editorial') add('error', 'E004', c, k, `Falta el campo requerido "${k}".`); }
      else if (typeof c[k] !== 'string') add('error', 'E005', c, k, `Debe ser string (recibido: ${typeof c[k]}).`);
      else if (!c[k].trim() && k !== 'nota_editorial') add('error', 'E004', c, k, 'Campo vacío.');
    }

    const id = String(c.id ?? '');
    if (id && !/^TAO_(\d{4,}|NEW_\d{3,})$/.test(id))
      add('error', 'E003', c, 'id', `Formato de id inválido: "${id}". Esperado TAO_0000 o TAO_NEW_000.`);
    if (idsVistos.has(id))
      add('error', 'E003', c, 'id', `id duplicado (también en índice ${idsVistos.get(id)}).`);
    else idsVistos.set(id, idx);

    const frase = String(c.frase ?? '');
    const interp = String(c.interpretacion ?? '');
    const pract = String(c.practica_hoy ?? '');
    const nota = String(c.nota_editorial ?? '');
    const linaje = String(c.linaje ?? '').trim();
    const cat = String(c.categoria ?? '').trim();
    const todo = `${frase} ${interp} ${pract}`;
    const notaN = norm(nota);

    // ── Procedencia editorial
    for (const a of AUTORES_EXCLUIDOS) {
      if (notaN.includes(norm(a))) {
        add('error', 'E101', c, 'nota_editorial', `Fuente excluida por criterio editorial: "${a}".`,
          { sugerencia: 'Sustituir por fuente primaria verificable o eliminar la tarjeta.' });
        break;
      }
    }
    const agreg = AGREGADORES.find((g) => notaN.includes(norm(g)));
    if (agreg && !tieneAparato(nota))
      add('error', 'E102', c, 'nota_editorial', `Importación de agregador ("${agreg}") sin referencia textual.`,
        { sugerencia: 'Verificar autoría y obra; ZenQuotes atribuye mal con frecuencia.' });

    if (!nota.trim())
      add('warn', 'W104', c, 'nota_editorial', 'nota_editorial vacía: procedencia no declarada.');
    else if (NOTAS_GENERICAS.includes(nota.trim().toLowerCase()))
      add('warn', 'W104', c, 'nota_editorial', `Nota genérica ("${nota.trim()}"): no identifica fuente ni autoría.`);

    // ── Relleno de IA
    for (const b of BOILERPLATE) {
      if (norm(interp).includes(norm(b)) || norm(pract).includes(norm(b))) {
        add('warn', 'W103', c, 'interpretacion/practica_hoy', `Relleno de IA detectado: "${b}…".`,
          { sugerencia: 'Reescribir: 1–2 oraciones específicas y micro-acción verificable.' });
        break;
      }
    }

    // ── Lenguaje inclusivo
    const comparaGenero = /mujer| mujeres|femenin/i.test(todo);
    for (const re of MASCULINO_GENERICO) {
      const m = frase.match(re) || interp.match(re);
      if (m && !comparaGenero) {
        add('error', 'E201', c, 'frase', `Genérico masculino: "${m[0]}".`,
          { sugerencia: 'Usar "quien", "la persona sabia" o forma impersonal.' });
        break;
      }
    }
    for (const re of CAPACITISMO) {
      const m = todo.match(re);
      if (m) {
        add('warn', 'W202', c, 'frase/interpretacion', `Posible metáfora capacitista: "${m[0]}".`,
          { sugerencia: 'Reformular sin usar una discapacidad como metáfora de error o déficit.' });
        break;
      }
    }
    if (SOMATICO_EXCLUYENTE.some((re) => re.test(pract)) && !SOMATICO_INCLUSIVO.test(pract))
      add('warn', 'W203', c, 'practica_hoy', 'Práctica somática sin alternativa corporal.',
        { sugerencia: 'Añadir "…o donde tu cuerpo te sostenga (asiento, manos, espalda)".' });

    // ── Violencia: solo se marca si NO hay aparato crítico
    for (const re of VIOLENCIA) {
      if (re.test(frase)) {
        if (!tieneAparato(nota))
          add('warn', 'W204', c, 'nota_editorial', 'Imagen violenta sin aparato crítico que explique su sentido no literal.',
            { sugerencia: 'NO borrar: añadir fuente (p. ej. Linji lu / Mumonkan) y nota de lectura no literal.' });
        break;
      }
    }
    for (const re of RIESGO_CLINICO) {
      if (re.test(todo)) {
        add('warn', 'W206', c, 'frase/interpretacion/practica_hoy', 'Consejo con riesgo para personas vulnerables.',
          { sugerencia: 'Reformular con salvaguarda (avisar, atender el dolor, validar la pérdida).' });
        break;
      }
    }
    for (const re of CULPABILIZANTE) {
      if (re.test(todo)) {
        add('warn', 'W205', c, 'frase/interpretacion', 'Formulación culpabilizante o de positividad obligatoria.',
          { sugerencia: 'Reencuadrar en términos de agencia y disposición, no de culpa.' });
        break;
      }
    }

    // ── Taxonomía y coherencia doctrinal
    if (linaje && !LINAJES_VALIDOS.has(linaje))
      add(CAT ? 'error' : 'warn', CAT ? 'E301' : 'W301', c, 'linaje', `Linaje fuera del catálogo canónico: "${linaje}".`);
    if (CAT && cat && !CAT.categoria.has(cat))
      add('error', 'E302', c, 'categoria', `Categoría fuera del catálogo canónico: "${cat}".`);
    if (cat && !/^[a-z][a-z0-9_]*$/.test(cat))
      add('warn', 'W302', c, 'categoria', `Categoría no es slug snake_case: "${cat}".`);
    for (const grupo of SINONIMOS_CATEGORIA) {
      if (grupo.includes(cat) && cat !== grupo[0])
        add('warn', 'W302', c, 'categoria', `Categoría sinónima de "${grupo[0]}": "${cat}".`,
          { sugerencia: `Unificar en "${grupo[0]}".` });
    }

    if (/hexagrama|yi jing|i ching/.test(notaN) && !['taoismo', 'contemporaneo'].includes(linaje))
      add('warn', 'W303', c, 'linaje', `Fuente del Yijing clasificada como "${linaje}".`,
        { sugerencia: 'El Yijing no es zen ni budista. Usar "taoismo".' });
    if (/koan|mumonkan|zhaozhou|linji|dogen|shobogenzo|buda|monje|maestro/.test(notaN + ' ' + norm(frase))
        && linaje === 'taoismo')
      add('warn', 'W303', c, 'linaje', 'Material Chan/Zen clasificado como "taoismo".',
        { sugerencia: 'Reclasificar a "zen" o "budismo".' });
    if (/meditaciones|enquiridion|epicteto|seneca|marco aurelio|musonio/.test(notaN)
        && !['estoicismo', 'contemporaneo'].includes(linaje))
      add('warn', 'W303', c, 'linaje', `Fuente estoica clasificada como "${linaje}".`);
    if (linaje === 'contemporaneo' && ACT_KEYWORDS[cat])
      add('info', 'W303', c, 'linaje', 'Tarjeta de proceso ACT con linaje "contemporaneo".',
        { sugerencia: 'Citar la fuente ACT (Hayes / Wilson / Harris / Zurita Ona / Villatte) en nota_editorial.' });

    if (ACT_KEYWORDS[cat]) {
      const p = norm(pract);
      if (!ACT_KEYWORDS[cat].some((k) => p.includes(norm(k))))
        add('warn', 'W304', c, 'practica_hoy', `La práctica no corresponde al proceso ACT "${cat}".`,
          { sugerencia: 'Alinear categoría y ejercicio (defusión ≠ acción comprometida ≠ valores).' });
    }

    // ── Forma y extensión
    if (frase.length > LIMITES.fraseChars)
      add('warn', 'W401', c, 'frase', `Frase demasiado larga (${frase.length} caracteres).`);
    if (frase.trim().split(/\s+/).length > LIMITES.frasePalabras)
      add('warn', 'W401', c, 'frase', `Frase con más de ${LIMITES.frasePalabras} palabras: pierde el golpe.`);
    if (interp.length > LIMITES.interpretacion)
      add('warn', 'W402', c, 'interpretacion', `Interpretación larga (${interp.length}). Máx. 2 oraciones.`);
    if (pract.length > LIMITES.practica)
      add('warn', 'W403', c, 'practica_hoy', `Práctica larga (${pract.length}). Debe ser micro-acción < 2 min.`);

    // ── Higiene (autocorregible)
    for (const k of CAMPOS_REQ) {
      const v = c[k];
      if (typeof v === 'string' && v !== v.trim().replace(/\s{2,}/g, ' '))
        add('warn', 'W501', c, k, 'Espacios sobrantes.', { fixable: true });
    }
    if (JSON.stringify(Object.keys(c)) !== JSON.stringify(ORDEN.filter((k) => k in c)))
      add('warn', 'W501', c, null, 'Orden de claves no canónico.', { fixable: true });

    // ── Duplicados exactos
    const key = norm(frase);
    if (key) {
      if (frasesVistas.has(key))
        add('warn', 'W404', c, 'frase', `Frase duplicada de ${frasesVistas.get(key)}.`);
      else frasesVistas.set(key, id);
      tokenCache.push({ id, card: c, t: tokens(frase) });
    }
  });

  // ── Casi-duplicados (Jaccard)
  for (let i = 0; i < tokenCache.length; i++) {
    for (let j = i + 1; j < tokenCache.length; j++) {
      const s = jaccard(tokenCache[i].t, tokenCache[j].t);
      if (s >= 0.82)
        add('warn', 'W405', tokenCache[j].card, 'frase',
          `Casi-duplicada de ${tokenCache[i].id} (similitud ${(s * 100).toFixed(0)}%).`,
          { sugerencia: 'Fusionar o diferenciar el enfoque.' });
    }
  }
}

// ─────────────────────────── FIX ───────────────────────────────
function aplicarFixes(ds) {
  let n = 0;
  ds.cards = ds.cards.map((c) => {
    const out = {};
    for (const k of ORDEN) {
      if (!(k in c)) continue;
      let v = c[k];
      if (typeof v === 'string') {
        const limpio = v.trim().replace(/\s{2,}/g, ' ');
        if (limpio !== v) n++;
        v = limpio;
      }
      out[k] = v;
    }
    for (const k of Object.keys(c)) if (!(k in out)) out[k] = c[k]; // conserva campos extra
    if (JSON.stringify(Object.keys(c)) !== JSON.stringify(Object.keys(out))) n++;
    return out;
  });
  return n;
}

// ────────────────────────── REPORTE ────────────────────────────
const RULES = {
  E001: 'Estructura del dataset', E002: 'Tarjeta no objeto', E003: 'id inválido o duplicado',
  E004: 'Campo requerido faltante/vacío', E005: 'Tipo incorrecto',
  E101: 'Fuente excluida por criterio editorial', E102: 'Agregador sin verificación textual',
  E301: 'Linaje fuera del catálogo canónico', E302: 'Categoría fuera del catálogo canónico',
  W103: 'Relleno de IA', W104: 'nota_editorial vacía o genérica',
  E201: 'Genérico masculino', W202: 'Metáfora capacitista', W203: 'Práctica somática excluyente',
  W204: 'Violencia sin aparato crítico', W205: 'Formulación culpabilizante', W206: 'Consejo con riesgo clínico',
  W301: 'Linaje fuera de taxonomía', W302: 'Categoría inválida o sinónima',
  W303: 'Desalineación fuente↔linaje', W304: 'Práctica incoherente con proceso ACT',
  W401: 'Frase demasiado larga', W402: 'Interpretación larga', W403: 'Práctica larga',
  W404: 'Frase duplicada', W405: 'Casi-duplicada', W501: 'Higiene de formato (autocorregible)',
};

function reportar(total) {
  const err = findings.filter((f) => f.level === 'error');
  const warn = findings.filter((f) => f.level === 'warn');
  const info = findings.filter((f) => f.level === 'info');

  if (!QUIET) {
    console.log(`\n  Dataset: ${FILE}`);
    console.log(`  Tarjetas: ${total}  Errors: ${err.length}   Warnings: ${warn.length}   Info: ${info.length}\n`);
    const porCodigo = new Map();
    for (const f of findings) {
      if (!porCodigo.has(f.code)) porCodigo.set(f.code, []);
      porCodigo.get(f.code).push(f);
    }
    for (const [code, list] of [...porCodigo].sort((a, b) => b[1].length - a[1].length)) {
      const lvl = list[0].level.toUpperCase().padEnd(5);
      console.log(`  ${lvl} ${code}  ${RULES[code] ?? ''}  (${list.length})`);
      for (const f of list.slice(0, 5)) {
        console.log(`         · ${f.id}${f.field ? ` [${f.field}]` : ''}: ${f.message}`);
        if (f.sugerencia) console.log(`           → ${f.sugerencia}`);
      }
      if (list.length > 5) console.log(`         … y ${list.length - 5} más`);
      console.log('');
    }
    const ranking = new Map();
    for (const f of findings) ranking.set(f.id, (ranking.get(f.id) ?? 0) + 1);
    const top = [...ranking].sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (top.length) {
      console.log('  Tarjetas con más incidencias:');
      for (const [id, n] of top) console.log(`    ${id.padEnd(14)} ${n}`);
      console.log('');
    }
  }

  if (JSON_OUT) {
    fs.writeFileSync(JSON_OUT, JSON.stringify({
      file: FILE, generado: new Date().toISOString(), tarjetas: total,
      resumen: { errors: err.length, warnings: warn.length, info: info.length },
      hallazgos: findings,
    }, null, 2), 'utf8');
    if (!QUIET) console.log(`  Reporte JSON: ${JSON_OUT}\n`);
  }

  if (err.length) return 1;
  if (warn.length > MAX_WARN) {
    if (!QUIET) console.log(`  Falla: ${warn.length} warnings superan el máximo (${MAX_WARN}).\n`);
    return 1;
  }
  if (!QUIET) console.log('  Validación superada.\n');
  return 0;
}

// ─────────────────────────── MAIN ──────────────────────────────
function main() {
  if (flag('list-rules')) {
    for (const [k, v] of Object.entries(RULES)) console.log(`${k}  ${v}`);
    return 0;
  }
  if (!fs.existsSync(FILE)) {
    console.error(`No se encuentra el archivo: ${FILE}`);
    return 2;
  }
  let ds;
  try {
    ({ data: ds } = cargar(FILE));
  } catch (e) {
    console.error(`Error al leer/parsear: ${e.message}`);
    return 2;
  }

  if (FIX) {
    const n = aplicarFixes(ds);
    fs.copyFileSync(FILE, `${FILE}.bak`);
    fs.writeFileSync(FILE, `window.TAOISTA_DATASET = ${JSON.stringify(ds, null, 2)};\n`, 'utf8');
    console.log(`Fixes aplicados: ${n}. Backup en ${FILE}.bak`);
  }

  validar(ds);
  return reportar(Array.isArray(ds.cards) ? ds.cards.length : 0);
}

process.exit(main());