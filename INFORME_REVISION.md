> **Nota:** este informe es anterior a la aplicación de `docs/REESCRITURAS_CORREGIDAS.md`. Estado actual: 458 tarjetas, 0 errores y 0 advertencias (ver docs/DECISIONES_CURADURIA.md).

# Informe de revisión del dataset taoísta

Generado: 2026-11-21 · Rama `claude/academic-inclusive-dataset-96xamn`

## 1. Resumen

| Indicador | Valor |
|---|---|
| Tarjetas | 461 (antes 579) |
| Errores | 0 |
| Advertencias | 469 |
| Avisos informativos | 51 |

## 2. Cambios ya aplicados

- Eliminadas **118 tarjetas**: autores excluidos por criterio editorial (Napoleon Hill, Deepak Chopra, Naval Ravikant, Norman Vincent Peale, Denis Waitley, Brian Tracy, entre otros) y citas de ZenQuotes sin fuente textual.
- Reescrito el genérico masculino (“el sabio”, “el hombre”, “el necio”) en 33 campos de 32 tarjetas.
- Normalizados espacios y orden de claves.
- Validador reemplazado por `validate_dataset.cjs` (incluye catálogo canónico).

## 3. Pendiente de revisión humana

| Código | Regla | Tarjetas |
|---|---|---|
| W104 | Nota editorial vacía o genérica | 298 |
| W303 | Fuente ↔ linaje desalineados | 61 |
| W103 | Relleno de IA | 54 |
| W302 | Categoría sinónima/no unificada | 46 |
| W304 | Práctica incoherente con proceso ACT | 34 |
| W501 | Formato | 9 |
| W204 | Imagen violenta sin aparato crítico | 7 |
| W203 | Práctica somática sin alternativa | 4 |
| W202 | Metáfora capacitista | 3 |
| W405 | Casi-duplicada | 2 |
| W401 | Frase demasiado larga | 1 |
| W205 | Formulación culpabilizante | 1 |

## 4. Detalle por regla

### W103 — Relleno de IA (54)

TAO_0005, TAO_0019, TAO_0021, TAO_0025, TAO_0028, TAO_0034, TAO_0036, TAO_0047, TAO_0049, TAO_0059, TAO_0061, TAO_0064, TAO_0071, TAO_0075, TAO_0079, TAO_0083, TAO_0095, TAO_0103, TAO_0106, TAO_0107, TAO_0109, TAO_0114, TAO_0116, TAO_0126, TAO_0130, TAO_0140, TAO_0151, TAO_0152, TAO_0185, TAO_0187, TAO_0205, TAO_0211, TAO_0214, TAO_0215, TAO_0221, TAO_0223, TAO_0242, TAO_0306, TAO_0312, TAO_0355, TAO_0368, TAO_0379, TAO_0380, TAO_0393, TAO_0401, TAO_0418, TAO_0424, TAO_0435, TAO_0456, TAO_0457, TAO_0504, TAO_0542, TAO_0555, TAO_0560

*Sugerencia:* Reescribir: 1–2 oraciones específicas y micro-acción verificable.

### W304 — Práctica incoherente con proceso ACT (34)

TAO_0005, TAO_0013, TAO_0014, TAO_0017, TAO_0019, TAO_0163, TAO_0164, TAO_0169, TAO_0246, TAO_0249, TAO_0250, TAO_0251, TAO_0256, TAO_0257, TAO_0261, TAO_0262, TAO_0263, TAO_0264, TAO_0265, TAO_0267, TAO_0268, TAO_0270, TAO_0272, TAO_0274, TAO_0289, TAO_0293, TAO_0295, TAO_0296, TAO_0352, TAO_0356, TAO_0428, TAO_0540, TAO_0541, TAO_0544

*Sugerencia:* Alinear categoría y ejercicio (defusión ≠ acción comprometida ≠ valores).

### W302 — Categoría sinónima/no unificada (46)

TAO_0005, TAO_0006, TAO_0007, TAO_0008, TAO_0009, TAO_0010, TAO_0011, TAO_0021, TAO_0022, TAO_0151, TAO_0152, TAO_0172, TAO_0173, TAO_0174, TAO_0175, TAO_0185, TAO_0187, TAO_0188, TAO_0189, TAO_0190, TAO_0201, TAO_0206, TAO_0207, TAO_0208, TAO_0209, TAO_0210, TAO_0211, TAO_0212, TAO_0213, TAO_0214, TAO_0215, TAO_0216, TAO_0217, TAO_0218, TAO_0219, TAO_0220, TAO_0221, TAO_0222, TAO_0223, TAO_0237, TAO_0500, TAO_0501, TAO_0502, TAO_0503, TAO_0504, TAO_0505

*Sugerencia:* Unificar en "accion".

### W204 — Imagen violenta sin aparato crítico (7)

TAO_0085, TAO_0104, TAO_0123, TAO_0424, TAO_0448, TAO_0460, TAO_0488

*Sugerencia:* NO borrar: añadir fuente (p. ej. Linji lu / Mumonkan) y nota de lectura no literal.

### W205 — Formulación culpabilizante (1)

TAO_0234

*Sugerencia:* Reencuadrar en términos de agencia y disposición, no de culpa.

### W202 — Metáfora capacitista (3)

TAO_0044, TAO_0091, TAO_0101

*Sugerencia:* Reformular sin usar una discapacidad como metáfora de error o déficit.

### W203 — Práctica somática sin alternativa (4)

TAO_0013, TAO_0057, TAO_0458, TAO_0543

*Sugerencia:* Añadir "…o donde tu cuerpo te sostenga (asiento, manos, espalda)".

### W401 — Frase demasiado larga (1)

TAO_0023

### W405 — Casi-duplicada (2)

TAO_0196, TAO_0452

*Sugerencia:* Fusionar o diferenciar el enfoque.

### W303 — Fuente ↔ linaje desalineados (61)

TAO_0005, TAO_0006, TAO_0007, TAO_0008, TAO_0009, TAO_0010, TAO_0011, TAO_0012, TAO_0013, TAO_0014, TAO_0015, TAO_0016, TAO_0017, TAO_0018, TAO_0019, TAO_0020, TAO_0163, TAO_0164, TAO_0165, TAO_0166, TAO_0167, TAO_0168, TAO_0169, TAO_0246, TAO_0247, TAO_0248, TAO_0249, TAO_0250, TAO_0251, TAO_0252, TAO_0253, TAO_0254, TAO_0255, TAO_0256, TAO_0257, TAO_0258, TAO_0259, TAO_0260, TAO_0261, TAO_0262, TAO_0263, TAO_0264, TAO_0265, TAO_0266, TAO_0267, TAO_0268, TAO_0269, TAO_0270, TAO_0271, TAO_0272, TAO_0273, TAO_0305, TAO_0307, TAO_0343, TAO_0362, TAO_0363, TAO_0366, TAO_0380, TAO_0418, TAO_0433, TAO_0458

*Sugerencia:* Citar la fuente ACT (Hayes / Wilson / Harris / Zurita Ona / Villatte) en nota_editorial.

### W104 — Notas editoriales genéricas o vacías (298)

Ver `npm run validate:report` para el listado completo.

## 5. Próximos pasos

1. Sustituir notas genéricas por fuente primaria verificable (obra, capítulo, traducción).
2. Reescribir interpretaciones con relleno de IA.
3. Unificar categorías sinónimas y alinear prácticas ACT.
4. Verificar y, solo entonces, integrar las 100 tarjetas nuevas (atribuciones sin comprobar).
