import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const datasetPath = path.join(__dirname, 'public', 'dataset_taoista.js');
const catalogPath = path.join(__dirname, 'catalogos_canonicos_v1.json');

// --- Load Catalog ---
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')).catalogos_canonicos;

// --- Load Dataset ---
const datasetContent = fs.readFileSync(datasetPath, 'utf8');
const jsonText = datasetContent
  .replace(/^\s*window\.TAOISTA_DATASET\s*=\s*/, '')
  .replace(/;\s*$/, '');
let cards;
try {
  const dataset = Function(`return (${jsonText})`)();
  cards = dataset.cards;
} catch (err) {
  console.error('Could not parse dataset_taoista.js with Function evaluation:', err);
  process.exit(1);
}

console.log('--- INTEGRITY REPORT ---');
console.log(`Total cards: ${cards.length}`);

// Unique IDs
const ids = cards.map(c => c.id);
const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupIds.length > 0) {
    console.error(`[ERROR] Duplicate IDs found: ${[...new Set(dupIds)]}`);
    process.exit(1);
} else {
    console.log('[OK] All IDs are unique.');
}

// Unique Phrases (Normalized)
const phrases = cards.map(c => c.frase.toLowerCase().trim().replace(/[.,!?;:()"]/g, '').replace(/\s+/g, ' '));
const dupPhrases = phrases.filter((p, i) => phrases.indexOf(p) !== i);
if (dupPhrases.length > 0) {
    const uniqueDups = [...new Set(dupPhrases)];
    console.warn(`[WARNING] Potential duplicate phrases found: ${uniqueDups.length}`);
    uniqueDups.forEach(p => {
        const matchingCards = cards.filter(c => c.frase.toLowerCase().trim().replace(/[.,!?;:()"]/g, '').replace(/\s+/g, ' ') === p);
        const cardIds = matchingCards.map(c => c.id).join(', ');
        console.warn(`  - "${p.substring(0, 60)}..." in cards: [${cardIds}]`);
    });
} else {
    console.log('[OK] No duplicate phrases found.');
}

// Canonical Labels
let invalidCat = [];
let invalidLin = [];
cards.forEach(card => {
    if (!catalog.categoria.includes(card.categoria)) invalidCat.push(card.categoria);
    if (!catalog.linaje.includes(card.linaje)) invalidLin.push(card.linaje);
});

let failed = false;
if (invalidCat.length > 0) {
    console.error(`[ERROR] Invalid categories found: ${[...new Set(invalidCat)]}`);
    failed = true;
} else {
    console.log('[OK] All categories are canonical.');
}

if (invalidLin.length > 0) {
    console.error(`[ERROR] Invalid lineages found: ${[...new Set(invalidLin)]}`);
    failed = true;
} else {
    console.log('[OK] All lineages are canonical.');
}

// Missing Fields
const required = ['id', 'frase', 'interpretacion', 'practica_hoy', 'categoria', 'linaje'];
cards.forEach((c, i) => {
    required.forEach(f => {
        if (!c[f]) {
            console.error(`[ERROR] Card ID ${c.id} missing field: ${f}`);
            failed = true;
        }
    });
});

if (failed) {
    process.exit(1);
} else {
    console.log('[SUCCESS] Dataset is 100% valid!');
}
