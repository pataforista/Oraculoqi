# Cómo funcionan las apps similares y qué podemos mejorar

Fecha: noviembre de 2026. Alcance: apps de frases motivacionales, estoicismo, taoísmo/zen, mindfulness y "carta del día" (tarot). Método: fichas de tienda, documentación de los desarrolladores y estudios publicados. Las fichas de tienda son autodescripciones comerciales: describen funciones, no prueban eficacia.

## 1. Qué hacen

| App | Mecánica central | Qué la sostiene |
|---|---|---|
| Motivation (Monkey Taps) | Miles de frases por tema, widgets en inicio y bloqueo, recordatorios varias veces al día, imágenes para compartir | Widgets y notificaciones; modelo freemium. Reseñas mixtas sobre notificaciones y estilo de los widgets [1] |
| Daily Stoic / Stoicism260 | Una lección por día: cita, pregunta, historia breve, reto práctico | Formato "un día a la vez" [2] |
| stoic. (journal) | Preparación por la mañana, reflexión por la noche; la intención matutina guía la pregunta nocturna | Escritura breve, plantillas, seguimiento de hábitos. Quejas por preguntas repetidas [3] |
| Plum Village | Meditaciones, charlas, recursos y "campana de la atención plena" que invita a tres respiraciones durante el día | Gratis, sin anuncios ni compras; 500 000+ descargas según la propia organización [4] |
| Insight Timer | Frase al abrir la app (desactivable) y archivo de frases guardadas | Biblioteca enorme y comunidad [5] |
| Calm | "Daily Calm": una meditación diaria; recordatorio diario | Amplitude atribuye al recordatorio parte de la retención (caso de proveedor, no verificado) [6] |
| Labyrinthos (tarot) | Lectura diaria, diario donde cada lectura lleva notas propias, avisos para releerla más tarde ("hindsight") | Diario + recordatorios diario/semanal/mensual; sin anuncios [7] |
| Daily Dao, Tao Te Ching (Tao Labs), Hanka | Un capítulo o frase por día, serifa, tono cálido, modo oscuro, sin cuenta, sin conexión | Sobriedad y privacidad [8] |

## 2. Qué dice la evidencia

- **Retención real.** En 93 apps de salud mental con 10 000+ instalaciones, la retención mediana a 30 días fue 3,3 %; mindfulness/meditación, 4,7 % (Baumel et al., JMIR 2019) [9]. Diseñar para que cada visita valga, no para forzar la siguiente.
- **Notificaciones.** En un ensayo microaleatorizado (Drink Less, 2023), una notificación triplicó la probabilidad de abrir la app en la hora siguiente, pero no cambió el tiempo hasta el abandono [10]. Suben el uso inmediato; no demuestran fidelidad.
- **Rachas.** Un estudio de consumo (Silverman y Barasch, *J. Consumer Research*, 2023, citado en fuente secundaria) halló que quien rompe una racha tiene más probabilidad de abandonar del todo [11]. No hay ensayos que midan ansiedad por rachas en apps de bienestar; la advertencia es razonable pero no concluyente.
- **Escritura breve.** Metaanálisis de 31 ECA (N = 4 012): la escritura expresiva reduce depresión, ansiedad y estrés con efecto pequeño (g ≈ −0,12), mayor con sesiones separadas 1–3 días [12]. Justifica una nota opcional, no promesas terapéuticas.
- **Patrones manipuladores.** Un informe de la Universidad de Melbourne sobre 15 apps de bienestar evalúa "captura de datos" e "insistencia emocional"; el 76 % de 642 servicios por suscripción usaba al menos un patrón oscuro (estudio citado por la FTC) [13]. Un espacio de calma pierde credibilidad si insiste.
- **PWA y avisos en iPhone.** Las notificaciones push funcionan desde iOS 16.4, solo si la app se añadió a la pantalla de inicio y el permiso se pide tras un toque; requieren servidor [14]. El recordatorio por calendario (.ics) que ya existe no necesita servidor ni datos personales.

## 3. Oráculo Taoísta frente a ese panorama

Lo que ya hace bien (y conviene proteger): ritual de desvelar la carta, una sincronía por día, práctica concreta ("Invitación hoy"), fuente visible, Codex con búsqueda y respaldo, funciona sin conexión, sin cuenta, sin rastreo, imagen para compartir.

## 4. Propuestas, por prioridad

| # | Propuesta | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | **Nota personal por carta** ("¿Qué notaste al hacer la invitación?"), guardada solo en el dispositivo y exportable con el Codex | Patrón de Labyrinthos y stoic.; respaldo pequeño pero real de la escritura breve | Medio |
| 2 | **Vuelta de la noche / de mañana**: al abrir la app al día siguiente, una línea "Ayer tu invitación fue… ¿cómo te fue?" que enlaza a la nota | Patrón "hindsight" y mañana-noche; cierra el ciclo práctica → reflexión sin notificaciones | Bajo |
| 3 | **Racha amable**: cambiar "✦ N días seguidos" por "N días este mes", sin mensajes de pérdida | La ruptura de rachas se asocia a abandono | Bajo |
| 4 | **Proteger la carta del día**: "Otra sincronía" pasa a "Explorar otra" y aparece un enlace "Volver a la de hoy" | Formato "un día a la vez"; hoy el mazo infinito diluye la sincronía | Bajo |
| 5 | **Pausa de tres respiraciones** opcional tras leer la carta (animación breve, sin audio obligatorio, respeta movimiento reducido) | Campana de Plum Village; coherente con el tono contemplativo | Medio |
| 6 | **Historial de días**: calendario sencillo con la carta de cada día visitado | Mystic Mondays/Labyrinthos; da sentido de recorrido sin gamificar | Medio |
| 7 | **Menos puntos de donación**: dejar el botón del menú y la sección de info; quitar la línea dentro de la carta y la invitación cada 5 cartas | Evitar "insistencia emocional"; libera espacio en pantalla | Bajo |
| 8 | Notificaciones push | Solo con servidor y beneficio dudoso a largo plazo; mantener el .ics | No recomendado ahora |

No recomendado: monedas, niveles, insignias, feeds infinitos, IA conversacional, muros de pago.

## Fuentes

1. Motivation – Daily quotes, App Store: https://apps.apple.com/app/id876080126
2. Daily Stoic: https://apps.apple.com/app/id6747621585 · Stoicism260: https://apps.apple.com/us/app/stoicism260/id6475751227
3. stoic. journal: https://apps.apple.com/us/app/stoic/id1312926037 · Stoicism – Praxis: https://apps.apple.com/us/app/id6738201959
4. Plum Village: https://apps.apple.com/us/app/-/id1273719339 · https://plumvillage.app/about-the-plum-village-app
5. Insight Timer, ayuda sobre frases diarias: https://insight-timer.freshdesk.com/support/solutions/articles/67000688626-how-do-i-disable-daily-quotes-
6. Amplitude, "Meditate every day": https://amplitude.com/en-us/blog/meditate-every-day.md
7. Labyrinthos: https://apps.apple.com/app/id1155180220 · reseña de Bustle: https://www.bustle.com/life/labyrinthos-tarot-reading-app-review
8. Daily Dao: https://apps.apple.com/ae/app/daily-dao/id6465685578 · The Tao Te Ching: https://apps.apple.com/app/id1669940922 · Hanka: https://apps.apple.com/app/hanka/id6761462463
9. Baumel et al., JMIR 2019: https://www.jmir.org/2019/9/e14567
10. Bell et al., JMIR mHealth 2023: https://mhealth.jmir.org/2023/1/e38342/PDF
11. The Decision Lab, "Streak Creep": https://thedecisionlab.com/es-ES/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification
12. Metaanálisis de escritura expresiva (resumen): https://www.simplypsychology.org/expressive-writing-for-anxiety.html
13. University of Melbourne, Mental Health Apps Report: https://www.unimelb.edu.au/__data/assets/pdf_file/0005/5390222/Mental-Health-Apps-Report-2023-17-Dec.pdf · FTC, Dark Patterns Report: https://www.ftc.gov/system/files/ftc_gov/pdf/P214800%20Dark%20Patterns%20Report%209.14.2022%20-%20FINAL.pdf
14. Apple, Web Push en apps web: https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers.md
