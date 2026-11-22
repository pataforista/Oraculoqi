// Etiquetas visibles: los identificadores de categoría son slugs sin tildes.
const CATEGORY_LABELS = {
  accion_comprometida: 'Acción comprometida', aceptacion: 'Aceptación', asimetria: 'Asimetría',
  atencion: 'Atención', autorregulacion: 'Autorregulación', compasion: 'Compasión',
  comunicacion: 'Comunicación', defusion: 'Defusión', dialogo_interno: 'Diálogo interno',
  discriminacion: 'Discriminación', eleccion: 'Elección', energia: 'Energía',
  evitacion_experiencial: 'Evitación experiencial', experiencia_directa: 'Experiencia directa',
  habitos: 'Hábitos', lenguaje_y_realidad: 'Lenguaje y realidad', limites: 'Límites',
  momento_presente: 'Momento presente', no_dualidad: 'No dualidad', no_saber: 'No saber',
  ontologia: 'Ontología', practica: 'Práctica', priorizacion: 'Priorización',
  regulacion: 'Regulación', relacion_consigo: 'Relación consigo', saturacion: 'Saturación',
  wu_wei: 'Wu wei', yo_contexto: 'Yo como contexto'
};

export const categoryLabel = (slug) => {
  const s = String(slug ?? '');
  if (CATEGORY_LABELS[s]) return CATEGORY_LABELS[s];
  const t = s.replaceAll('_', ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};

// Resume `nota_editorial` en una línea legible: "Zhuangzi, cap. 19", "Creación original"…
export const sourceLabel = (nota) => {
  const n = String(nota ?? '').trim();
  if (!n) return '';
  if (/^creaci[oó]n original/i.test(n)) return 'Creación original';
  if (/^basado en el marco act/i.test(n)) return 'Marco ACT · Hayes, Strosahl & Wilson';
  let s = n.split(';')[0].split(/\.\s+(?=[A-ZÁÉÍÓÚ¿¡«])/)[0];
  s = s.replace(/«[^»]*»/g, '').replace(/\([^)]*[㐀-鿿][^)]*\)/g, '').replace(/[㐀-鿿]+/g, '');
  s = s.replace(/\s{2,}/g, ' ').replace(/[\s:,.\-]+$/, '').trim();
  if (!s) return '';
  return s.length > 72 ? `${s.slice(0, 71).trimEnd()}…` : s;
};
