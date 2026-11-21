# Diagnóstico
node curaduria/validate_dataset.cjs --file=public/dataset_taoista.js

# Autocorregir solo formato (hace .bak, no toca contenido)
node curaduria/validate_dataset.cjs --file=public/dataset_taoista.js --fix

# Reporte para revisar con calma
node curaduria/validate_dataset.cjs --json=reporte_curaduria.json

# CI: falla con cualquier error; warnings bajo umbral
node curaduria/validate_dataset.cjs --strict --max-warnings=50