const fs = require('fs');
const path = require('path');

const datasetPath = path.join(__dirname, 'dataset_taoista.js');
const catalogPath = path.join(__dirname, 'catalogos_canonicos_v1.json');

// --- Load Catalog ---
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')).catalogos_canonicos;

// --- Load Dataset ---
const datasetContent = fs.readFileSync(datasetPath, 'utf8');
const cardsMatch = datasetContent.match(/(?:\"cards\"|cards):\s*(\[.*\])/s);
if (!cardsMatch) {
    console.error('Could not find cards array in dataset_taoista.js');
    process.exit(1);
}
const cards = JSON.parse(cardsMatch[1]);

console.log('--- INTEGRITY REPORT ---');
console.log(`Total cards: ${cards.length}`);

// Unique IDs
const ids = cards.map(c => c.id);
const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupIds.length > 0) {
    console.error(`[ERROR] Duplicate IDs found: ${[...new Set(dupIds)]}`);
} else {
    console.log('[OK] All IDs are unique.');
}

// Unique Phrases (Normalized)
const phrases = cards.map(c => c.frase.toLowerCase().trim().replace(/[.,!?;:()"]/g, '').replace(/\s+/g, ' '));
const dupPhrases = phrases.filter((p, i) => phrases.indexOf(p) !== i);
if (dupPhrases.length > 0) {
    console.warn(`[WARNING] Potential duplicate phrases found: ${dupPhrases.length}`);
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

if (invalidCat.length > 0) {
    console.error(`[ERROR] Invalid categories found: ${[...new Set(invalidCat)]}`);
} else {
    console.log('[OK] All categories are canonical.');
}

if (invalidLin.length > 0) {
    console.error(`[ERROR] Invalid lineages found: ${[...new Set(invalidLin)]}`);
} else {
    console.log('[OK] All lineages are canonical.');
}

// Missing Fields
const required = ['id', 'frase', 'interpretacion', 'practica_hoy', 'categoria', 'linaje'];
cards.forEach((c, i) => {
    required.forEach(f => {
        if (!c[f]) console.error(`[ERROR] Card ID ${c.id} missing field: ${f}`);
    });
});
