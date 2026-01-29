const fs = require('fs');
const path = require('path');

const datasetPath = 'c:/Users/caceladab/Desktop/Oraculoqi/dataset_qi_v1.js';
const catalogPath = 'c:/Users/caceladab/Desktop/Oraculoqi/catalogos_canonicos_v1.json';

// --- Helper to parse the pseudo-JSON catalog ---
function parsePseudoJson(content) {
    // This is very specific to the format seen in catalogos_canonicos_v1.json
    const extractList = (key) => {
        const regex = new RegExp(key + '\\s*\\[([^\\]]+)\\]', 's');
        const match = content.match(regex);
        if (!match) return [];
        return match[1].split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(s => s);
    };

    return {
        categoria: extractList('categoria'),
        linaje: extractList('linaje')
    };
}

// --- Load Files ---
const datasetContent = fs.readFileSync(datasetPath, 'utf8');
const catalogContent = fs.readFileSync(catalogPath, 'utf8');

const catalog = parsePseudoJson(catalogContent);

// Extract cards from dataset_qi_v1.js (since it's assigned to window.QI_DATASET_V1)
const cardsMatch = datasetContent.match(/\"cards\":\s*(\[.*\])/s);
let cards = [];
if (cardsMatch) {
    try {
        // We need to be careful as it might have trailing commas or other JS-isms
        // A simple hack to get the JSON part:
        const jsonStr = cardsMatch[1].replace(/,\s*([\}\]])/g, '$1'); 
        cards = JSON.parse(jsonStr);
    } catch (e) {
        console.error('Error parsing cards JSON:', e.message);
        // Fallback: manual regex extraction
        const catRegex = /\"categoria\":\s*\"([^\"]+)\"/g;
        const linRegex = /\"linaje\":\s*\"([^\"]+)\"/g;
        let m;
        const dsCategories = [];
        const dsLineages = [];
        while ((m = catRegex.exec(datasetContent)) !== null) dsCategories.push(m[1]);
        while ((m = linRegex.exec(datasetContent)) !== null) dsLineages.push(m[1]);
        
        const uniqueDsCat = [...new Set(dsCategories)];
        const uniqueDsLin = [...new Set(dsLineages)];
        
        console.log('--- LOGICAL INTEGRITY REPORT ---');
        console.log('\nCanonical Categories:', catalog.categoria);
        console.log('\nDataset Categories found:', uniqueDsCat);
        
        const missingCat = uniqueDsCat.filter(c => !catalog.categoria.includes(c));
        console.log('\nCategories in Dataset NOT in Canonical:', missingCat);
        
        const unusedCat = catalog.categoria.filter(c => !dsCategories.includes(c));
        console.log('\nCanonical Categories NOT used in Dataset:', unusedCat);

        console.log('\n--- LINEAGE ---');
        const missingLin = uniqueDsLin.filter(l => !catalog.linaje.includes(l));
        console.log('Lineages in Dataset NOT in Canonical:', missingLin);
        
        process.exit(0);
    }
}

const dsCategories = cards.map(c => c.categoria);
const dsLineages = cards.map(c => c.linaje);
const uniqueDsCat = [...new Set(dsCategories)];
const uniqueDsLin = [...new Set(dsLineages)];

console.log('--- LOGICAL INTEGRITY REPORT ---');
console.log('\nCanonical Categories:', catalog.categoria.length);
console.log('Unique Categories in Dataset:', uniqueDsCat.length);

const missingCat = uniqueDsCat.filter(c => !catalog.categoria.includes(c));
console.log('\n[ERROR] Categories in Dataset NOT in Canonical:', missingCat);

const unusedCat = catalog.categoria.filter(c => !dsCategories.includes(c));
console.log('[INFO] Canonical Categories NOT used in Dataset:', unusedCat);

console.log('\n--- LINEAGE ---');
const missingLin = uniqueDsLin.filter(l => !catalog.linaje.includes(l));
console.log('[ERROR] Lineages in Dataset NOT in Canonical:', missingLin);

// Check if IDs are unique
const ids = cards.map(c => c.id);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length > 0) {
    console.log('[ERROR] Duplicate IDs found:', [...new Set(duplicateIds)]);
} else {
    console.log('[OK] All IDs are unique.');
}

// Check for missing fields
const requiredFields = ['id', 'frase', 'interpretacion', 'practica_hoy', 'categoria', 'linaje'];
cards.forEach((c, i) => {
    requiredFields.forEach(f => {
        if (!c[f]) console.log(`[ERROR] Card index ${i} (ID: ${c.id}) is missing field: ${f}`);
    });
});
