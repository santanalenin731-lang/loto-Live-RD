# Sistema de Loto Live RD - Documentación Técnica y Registro

Este documento centraliza la estructura, el funcionamiento y el historial de actualizaciones del sistema de Loto Live RD.

## 🏗️ Estructura del Sistema

### 1. Frontend (Capas de Presentación)
- **Tecnologías**: HTML5, Vanilla JavaScript, CSS3 (Custom Properties, Glassmorphism).
- **Componentes**: 
  - `index.html`: Dashboard principal con filtros por proveedor y tiempo.
  - `js/app.js`: Gestión de metadatos (`LOTTERY_META`), renderizado dinámico de tarjetas y lógica de filtros.
  - `css/styles.css`: Sistema de diseño responsivo y efectos visuales (incluyendo marcas de agua de logos).

### 2. Backend (Servidor y Datos)
- **Motor**: Node.js con Express.
- **Base de Datos**: SQLite3 (`backend/loteria.db`).
  - Tabla `draws`: Almacena `lottery_code`, `draw_date`, `draw_time` y `numbers` (JSON).
  - Restricciones UNIQUE para evitar duplicidad de resultados por día.
- **Gestión de Procesos**: `backend/cronManager.js` coordina los disparos de recolección de datos.

### 3. Motor de Extracción (Scrapers)
- **Universal Scraper**: `backend/scraper/universalTracker.js` (Puppeteer).
- **Lógica de Resiliencia**: 
  - **Poller con Reintentos**: Si un resultado no está disponible, el sistema reintenta cada minuto durante 30 minutos sin bloquear el servidor.
  - **Aislamiento**: Cada scraper corre en un entorno independiente con `try/catch`.

---

## ⚙️ Funcionamiento del Cron
El sistema está automatizado para capturar resultados en tres turnos:
- **Mañana**: La Primera, Anguila 10, King 12:30.
- **Tarde**: Real, Gana Más, LoteDom, Florida/NY Tarde, Anguila 1/6.
- **Noche**: Nacional Noche, Leidsa, Loteka, Primera Noche, Florida/NY Noche, Anguila 9.

---

## 🚨 Reglas Estrictas de Desarrollo (Obligatorias)
1. **Prioridad Local (STRICT)**: Cuando el usuario solicite crear o implementar alguna nueva función, la misma debe ser puesta primero en entorno local (`npm run dev` o equivalente en `localhost`).
2. **Cero Despliegue Prematuro**: Queda terminantemente PROHIBIDO realizar un `git push` o enviar cualquier código al repositorio de producción **antes de recibir el visto bueno explícito del usuario**. Si algo tiene errores al momento de programar, esto evitará romper la copia en la nube.
3. El orden universal de desarrollo debe ser: `Planear -> Codificar -> Probar en Local por el Usuario -> Confirmar -> Desplegar a GitHub`.
4. **PRIVACIDAD DE ESTE ARCHIVO (CRÍTICO)**: El archivo `SYSTEM.md` es **ESTRICTAMENTE CONFIDENCIAL** de manera intencional y está enlistado en `.gitignore`. Por ninguna circunstancia, un asistente, inteligencia artificial (Modelo) o script automatizado debe forzar (`git add -f`) u ordenar la subida de este documento a repositorios públicos como GitHub o Render. Su ignorancia debe ser completamente respetada.

---

## 📝 Registro de Actualizaciones Recientes

### 26 de Marzo, 2026 (v4.2) - Final Hero Fix & Banner Constraints
- **Corrección de Imagen Gigante**: Se detectó que el banner del Hero se desbordaba si el CSS no cargaba instantáneamente. Se implementaron restricciones de tamaño **inline** estrictas (`max-width: 500px`, `max-height: 300px`) y `object-fit: contain` para asegurar una visualización profesional en cualquier condición de carga.
- **Blindaje Estructural**: Se restauraron las variables del DOM (`bannerMap`, `heroVisualContainer`) para garantizar la persistencia de los cambios de slide.

### 26 de Marzo, 2026 (v4.1) - Fix King Logos & Syntax
- **Resolución de Case-Sensitivity en Render**: Se movió el logo de King Lottery a la raíz de logos (`/assets/images/logos/king_lottery.png`) y se forzó el uso de minúsculas para compatibilidad total con servidores Linux/Render.
- **Corrección de Sintaxis Crítica**: Se repararon comas faltantes en los bloques de `LOTTERY_META` tanto en el backend (`meta.js`) como en el frontend (`app.js`) que causaban el fallo del despliegue y la carga de datos.

### 26 de Marzo, 2026 (v4.0) - Fix Hero Carousel & Jackpot Banners
- **Reparación del Carousel**: Se corrigió un error crítico donde múltiples hilos del carousel se ejecutaban en paralelo en Render, causando que los títulos, premios e imágenes se mezclaran.
- **Atomicidad en el Hero**: La función `updateHeroSection` ahora limpia cualquier elemento previo antes de renderizar el nuevo slide, asegurando que la imagen coincida con la lotería.
- **Cache Busting v4.0**: Se forzó la recarga de activos estáticos con el parámetro `v=4.0` en `index.ejs` y las imágenes del banner en `app.js`.
- **Mejora Visual**: El "Premio Acumulativo" ahora usa verde neón (`#00ff3c`) y se posiciona antes del título para mayor impacto.

### 26 de Marzo, 2026 (v3.9) - Billetes Domingo & King Blueprint
- **Integración Permanente de Billetes (Lotería Nacional)**: Resultados de 6 dígitos, CSS `.ball.long`, limpieza de "Billetes Jueves".
- **Unificación Visual King Lottery**: Diseño "Blueprint" forzado en todos los sorteos de King (`king_lottery.png`).
- **Fix Frontend**: Corrección de bug en filtros por proveedor y eliminación del bloqueo post-sorteo (`-- --`).

### 25 de Marzo, 2026 - Desactivación de Falsos "Retrasos" y Ajustes de Lógica de Scrapers
- **Solución al "Falso Retraso" del Loto Pool (King Lottery y Lotería Real)**:
  - **Incidente**: Los sorteos `Loto Pool Medio Día` / `Loto Pool Noche` de King Lottery y `Loto Pool` de Lotería Real marcaban `RETRASADO` permanentemente, a pesar de que los números sí estaban publicados en la web fuente.
  - **Origen**: `universalTracker.js` y `realTracker.js` tenían una regla genética que exigía exactamente **5 bolos** para cualquier título que incluyera la palabra "Pool" (basado en Leidsa). Como Real y King Lottery solo sacan **4 bolos**, el sistema descartaba los resultados válidos por considerarlos "incompletos".
  - **Fix**: Se establecieron excepciones estrictas (`expectedLength = 4`) para King Lottery y Real antes de la regla genérica de 5 bolos, validando y guardando correctamente los sorteos en base de datos.
- **Resolución Crítica del Scraper de Loteka**:
  - **Incidente**: Todos los sorteos de Loteka aparecían eternamente retrasados.
  - **Origen**: En `lotekaTracker.js`, al inyectar la fecha de hoy (`25/03/2026`) dentro del navegador virtual de Puppeteer para validar los resultados, la variable `expectedDateLoteka` no se pasaba como parámetro a `page.evaluate()`. Esto causaba una búsqueda literal de la palabra `undefined` en el HTML, provocando que el scraper abortara silenciosamente devolviendo `[]`.
  - **Fix**: Se ancló la variable correctamente dentro del callback de Puppeteer (`}, expectedDateLoteka);`), restableciendo de inmediato la recolección de Lotto Loteka, Mega Chances, Repartidera, Quiniela y Toca 3.
- **Sincronización de Cron para Florida Noche**:
  - **Incidente**: El sorteo marcaba `RETRASADO` entre las 9:40 PM y las 10:35 PM ininterrumpidamente todos los días.
  - **Origen**: La Lotería Florida Noche juega alrededor de las 9:40 PM, pero el disparador (`cronManager.js`) estaba calendarizado erróneamente para las 10:35 PM (`35 22 * * *`), creando un bache de casi una hora donde el cliente exigía números que el servidor aún no salía a buscar.
  - **Fix**: Reconfiguración del cron a `45 21 * * *` (9:45 PM), alienando la recolección con la tirada oficial.
- **Bypass de `.gitignore_global` (Caso Leidsa Super Kino)**:
  - **Incidente**: Al aplicar los nuevos logos con fondo opaco para Leidsa, la imagen `super_kino_tv.png` era invisible para el control de cambios de Git e imposible de subir a producción.
  - **Origen**: Como se descubrió ayer, macOS interceptaba la subida por la regla global que ignoraba los PNGs creados de cero (`*.PNG` case-insensitive).
  - **Fix**: Uso deliberado del comando `git add -f` (force) directo sobre el path de la imagen, venciendo el bloqueo OS-level de Git.

### 24 de Marzo, 2026 - Fase 3: Estabilización de Datos y Nueva Estética de Banners (Logos Opacos)
- **Nueva Estética de Banners (Logos Opacos y Brillantes)**:
  - Transición de logos translúcidos (watermarks) a **Logos a todo color (100% Opacidad)** insertados como fondo en las tarjetas (Aplicado inicialmente a **Lotería Nacional**: `Gana_mas.PNG`, `Juega_pega_mas.PNG`, `Nacional_noche .PNG`).
  - **CSS Base Estricto para la Legibilidad (Blueprint para Futuras Loterías)**: Al volver opacos los backgrounds, se establecieron reglas maestras en `css/styles.css` que DEBEN aplicarse (mediante selectores CSS como `.lottery-card[data-lottery="proveedor_nuevo"]`) a las futuras imágenes de Leidsa, Loteka, Real, etc., para garantizar consistencia visual absoluta:
    1. **Brillo del Fondo:** Aplicando `opacity: 1 !important` y `filter: brightness(0.75)` a la tarjeta. Reduce la luz nativa de la imagen original un 25% para evitar el encandilamiento.
    2. **Degradado Oscuro (Vignette):** `background: linear-gradient(to bottom, rgba(17, 24, 39, 0.95) 0%, rgba(17, 24, 39, 0.2) 40%, rgba(17, 24, 39, 0.95) 100%) !important` en el seudo-elemento `::before` (con `z-index: 1`). Crea un velo negro superior/inferior para profundo contraste en textos perimetrales dejando brillar el centro del logo.
    3. **Drop-Shadow en Bolos:** Aumento global e intenso del `box-shadow` en los bolos (`0 8px 16px rgba(0,0,0,0.6)`) para que floten de forma limpia sobre áreas luminosas de la foto de fondo.
    4. **Letras 100% Blancas y Sombras Densas:** Envolvente absoluta de `color: #ffffff !important` y un contundente `text-shadow: 0 2px 4px rgba(0,0,0,0.95), 0 4px 12px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,1)` forzado a todo el `.card-header *` y `.card-footer *`.
    5. **Excepción del Badge "Hoy":** Blindaje de especificidad aplicado a `.text-pulsing-today` para que sea dictatoriamente verde neón brillante (`#00ff3c`) con un aura esmeralda, sobreviviendo así al text-override blanco de arriba.
    *(NOTA VITAL: Este "framework" estético fue verificado exitosamente en Nacional y **debe** replicarse textualmente añadiendo el atributo `[data-lottery="..."]` a estas mismas reglas en `styles.css` cuando se vayan incorporando los logos completos del resto de loterías).*
- **Resolución de "Retraso" (Estabilización Front-Back)**:
  - Optimización en `cronManager.js` para aumentar los reintentos de scraping a más de 120 (2.5+ horas cubiertas) en caso de que los proveedores tarden en emitir resultados.
  - Corrección de zona horaria (`America/Santo_Domingo`) en validadores y purga de resultados "viciados" del estado de Jackpots.
  - Se habilitó la transferencia síncrona del campo `draw_date` desde el backend por WebSocket (`new_result`) hacia la grilla de Jackpots para destrabar en tiempo real la máscara roja visual de "Retraso".
  - **Falsa Alarma de Retraso en Sorteos No-Diarios:** Loterías "gordas" como Loto Leidsa o Mega Millions (que juegan sólo un par de veces por semana) colapsaban si el usuario entraba un "día inactivo", declarando la lotería "RETRASADA" y escondiendo el historial de bolos en `-- --`. Se inyectó un índice `drawDays` (0=Dom a 6=Sáb) en la metadata. Si hoy NO es cronograma oficial, el analizador SPA exime al sorteo, no borra las bolas, e inyecta la chapa "Anterior" en lugar de "Hoy".
- **Enigma del Bolo Fantasma (Lotería Nacional 3er Número)**:
  - Se identificó un *Race Condition* donde el agregador (loteriasdominicanas.com / conectate.com.do) publicaba premios parciales (Ej: solo el 1ero y 2do premio) mientras el sorteo seguía en vivo. El scraper original capturaba este arreglo mutilado (`["57", "85"]`) y lo sellaba en la DB para el resto del día como resultado final.
  - Implementación de **Validación Hermética de Longitud** en `universalTracker.js` y `realTracker.js`: el scraper ahora audita que `numbers.length >= expectedLength`. Si Lotería Nacional no arroja estrictamente 3 resultados, se rechaza la extracción retornando `null` forzando al `cronManager` a re-encolar la tarea pasados 60 segundos hasta recoger la matriz completa.
- **Resolución de Assets Faltantes en Render (Case Sensitivity y GitIgnore)**:
  - **Incidente:** Las nuevas imágenes de fondo no se renderizaban en producción, exhibiendo tarjetas con fondos sólidos. Al auditar la telemetría, se descubrió que las imágenes nunca llegaron al servidor en la nube porque estaban guardadas como `.PNG` en mayúsculas.
  - **Origen:** Una regla maestra de ambiente OS X en tu `~/.gitignore_global` bloqueaba intencionalmente cualquier intento de *commit* de archivos `*.PNG`, lo que causaba silenciosas omisiones en los pushes de la carpeta `assets/images`.
  - **Solución Estandarizada:** Se renombraron físicamente los archivos a formato `snake_case` minúsculo puro (`gana_mas.png`, `nacional_noche.png`), permitiendo así saltarse la exclusión global de Git e indexarse oficialmente. También se estandarizaron estas rutas exactas dentro del metadata global (`LOTTERY_META`) de `js/app.js` blindándolas contra la case-sensitivity brutal del entorno Linux de Render.
- **DIRECTRIZ CRÍTICA FUTURA (🤖 PARA IA/LLM EN SESIONES SIGUIENTES):** 
  - Al leer un *prompt* del usuario como: *"Tengo nuevas imágenes en Leidsa/Loteka/La Primera, aplica los cambios"*, tu macro operativo **OBLIGATORIO** es clonar la parametrización CSS de la Lotería Nacional de `styles.css`.
  - Pasos taxativos: 
    1. Forzar opacidad sólida del bloque card (`opacity: 1` y `filter: brightness(0.75)`).
    2. Duplicar la gradiente negra fotográfica (`linear-gradient`) al `::before`.
    3. Multiplicar la extrusión de los Bolos con el Box Shadow severo (`0 8px 16px rgba(0,0,0,0.6)`).
    4. Proteger los textos de Header/Footer forzando `#ffffff !important` y sus sombras masivas (`text-shadow`).
    5. Someter al escudo de estado "Hoy" al dictado verde Neón (`.text-pulsing-today { color: #00ff3c !important }`). No hay cabida para desviación interpretativa; la Lotería Nacional es tu plantilla arquitectónica.

### 24 de Marzo, 2026 - Fase 4: Auditoría Integral de Código y Corrección de 10 Bugs
- **Auditoría Completa del Codebase (8 Archivos / ~2,700 Líneas)**:
  - Se ejecutó una revisión exhaustiva de `server.js`, `db.js`, `cronManager.js`, `meta.js`, `universalTracker.js`, `realTracker.js`, `lotekaTracker.js` y `js/app.js`, identificando 12 bugs clasificados en 3 niveles de severidad (Crítico, Medio, Bajo). Se corrigieron 10 de los 12. Los 2 restantes son deuda técnica inocua.
- **🔴 Correcciones Críticas**:
  - **Desincronización `meta.js` vs `app.js` (Rutas de Logos Nacional):** El backend (`meta.js`, usado por sitemap.xml y SSR) seguía referenciando las rutas viejas en mayúsculas (`Gana_mas.PNG`, `Nacional_noche .PNG`) mientras que el frontend ya había sido corregido a minúsculas. Esto causaba 404 en previsualizaciones OG de redes sociales. **Fix:** Se alinearon ambos archivos a `gana_mas.png`, `juega_pega_mas.png`, `nacional_noche.png`.
  - **WebSocket `broadcastNewResult` sin `draw_date`:** La función solo emitía `lottery_code`, `numbers`, `draw_time` y `timestamp`. Al omitir `draw_date`, la lógica `isDelayed` del frontend no podía resolver el estado correcto sin un refresh manual de la página. **Fix:** Se inyectó `draw_date` calculado con `Intl.DateTimeFormat` en zona `America/Santo_Domingo`.
  - **Loteka solo emitía Quiniela por Broadcast:** El scraper `lotekaTracker.js` extraía 5 sorteos (Quiniela, Mega Chances, MegaLotto, Toca 3, Repartidera) y los guardaba todos en DB, pero **solo retornaba** la Quiniela al `cronManager`. Los otros 4 sorteos no se propagaban en tiempo real. **Fix:** Se retorna el array completo de resultados. Se adaptó `processQueue` en `cronManager.js` para iterar y emitir broadcast individual por cada sorteo del array.
- **🟡 Correcciones de Severidad Media**:
  - **`runWithRetries` ignoraba `maxRetries`:** La `línea maxRetries = 150` sobreescribía sistemáticamente el parámetro recibido en cada llamada. Todos los scrapers reintentaban 150 veces (2.5 horas) en vez de las 15-30 programadas, potencialmente saturando la cola RAM del servidor. **Fix:** Se eliminó el override y el default es ahora 20.
  - **Real Super Palé sin `expectedLength`:** El scraper `realTracker.js` no tenía un caso para Super Palé (2 números). Caía al default de 3, rechazando permanentemente resultados válidos de 2 bolas como "parciales". **Fix:** `else if (targetTitle === 'Super Palé') expectedLength = 2;`.
  - **Nueva Yol Real truncaba el color:** La 4ta posición de Nueva Yol (el color: Amarilla, Roja, Verde, Azul) se descartaba por el `slice(0,3)` del default. **Fix:** `else if (targetTitle === 'Nueva Yol Real') expectedLength = 4;`.
  - **XSS Potencial en Rutas SSR:** En `server.js`, `humanProvider` y `humanDraw` se inyectaban sin sanitizar dentro de un `<script>`. **Fix:** Se reemplazó la interpolación directa por `JSON.stringify({provider, draw})`.
  - **`hasPassedSchedule` usaba Timezone del Navegador:** En `app.js`, la comparación horaria usaba `new Date()` (timezone local del navegador). Usuarios fuera de RD veían badges incorrectos ("Hoy" vs "Anterior"). **Fix:** Se implementó extracción de hora RD vía `Intl.DateTimeFormat('en-US', { timeZone: 'America/Santo_Domingo' }).formatToParts()`.
- **🟢 Correcciones de Severidad Baja**:
  - **Loteka sin validación de longitud:** Se añadió un mapa `expectedLengths` por `lotteryCode` dentro de `lotekaTracker.js` para validar que cada sorteo tenga la cantidad exacta de bolas antes de guardar en DB (Quiniela=3, Mega Chances=5, MegaLotto=8, Toca 3=3, Repartidera=1).
  - **Banners del Hero en `.PNG` mayúscula:** Los 3 banners del carousel (`Loto_mas.PNG`, `Loto_real.PNG`, `Mega_lotto.PNG`) se renombraron a `loto_mas.png`, `loto_real.png`, `mega_lotto.png` y se actualizaron las referencias en `app.js` para prevenir el mismo bloqueo del `~/.gitignore_global`.
- **Caché actualizado a `v3.7`** en `index.ejs`.

### 23 de Marzo, 2026 - Fase 2: Unificación UI, Fechas Precisas y Limpieza de Contenidos
- **Expansión Legal y Corporativa**:
  - Creación de la página `/acerca-de` con manifiesto de independencia, SSR y esquema JSON-LD (`AboutPage`).
  - Integración dinámica al `sitemap.xml` y limpieza del descargo de responsabilidad voluminoso en el footer.
- **Resolución Crítica de Fechas (Timezone Bug)**:
  - Se modificó la lógica en `app.js` para deducir el día exacto de cada sorteo basándose estrictamente en cruzar la hora local con el horario del sorteo programado (`scheduleDate`), esquivando el error de fechas adelantadas introducido por la inserción en huso horario UTC de los scrapers tras las 8 PM.
- **Unificación de la Subpágina (Sin Pestañas)**:
  - Eliminación absoluta del sistema de pestañas (*Tabs*) en la vista de resultados. Los globos y la guía de "Cómo Jugar" ahora fluyen en un solo *scroll* vertical ininterrumpido.
- **Limpieza Masiva de Diseño (Script)**:
  - Ejecución de un macro-script Regex sobre los 10 archivos de `/pages/providers/` para purgar todos los emojis (🎯, ⚡, 🎰), íconos integrados, márgenes de cristal (`glass-panel`), y estilos rígidos de bordes, promoviendo una lectura textual y semántica limpia.
- **Refinamiento UI (Botón Generador)**:
  - Purga de iconos repetitivos y creación de la clase CSS `.btn-generator-pulse` con efecto radar bioluminiscente verde para fomentar una llamada a la acción (CTA) intuitiva.
- **Flujo de Servidor**:
  - Actualización de `package.json` para acoger `node --watch` en la rutina de `npm run dev`.

### 23 de Marzo, 2026 - Fase 1: Implementación SEO Técnico Crítico
- **Estructura Semántica de Cabeceras**:
  - Se inyectó globalmente la directiva `<meta name="robots" content="index, follow, max-image-preview:large">` para garantizar la completa indexación de imágenes y resultados, junto a URLs canónicas unificadas (`<link rel="canonical">`) que blindan al sitio contra penalizaciones por contenido duplicado.
- **Optimización para Redes Sociales (Open Graph & Twitter Cards)**:
  - Se añadieron etiquetas dinámicas `og:site_name`, `og:url`, y coberturas robustas de `twitter:card` con previsualizaciones gráficas ricas usando `LotoliveRD.png` como fallback predeterminado para enlaces compartidos.
- **Estandarización JSON-LD a Nivel Root**:
  - Integración semántica de Schema.org tipo `WebSite` mas `SearchAction` encapsulada programáticamente en el inicializador del backend (`server.js`), solidificando a la aplicación como una entidad corporativa principal rastreable por Google.
- **Fallbacks EJS Anti-Crash**:
  - Encriptación técnica bajo validación estructural (`typeof url !== 'undefined'`) para evitar excepciones directas de `ReferenceError`, dotándole a la plataforma resiliencia en casos de faltas de variables de servidor durante el tiempo de renderizado SSR.

### 22 de Marzo, 2026 - Reconstrucción Arquitectónica del Carousel UI y Limpieza de Subpáginas
- **Refactorización del Hero Banner (Carousel)**:
  - Modificación estructural profunda para permitir que las imágenes nativas sirvan como "Fondos Contenedores" de manera responsiva, abrazando geométricamente a los bolos ganadores.
  - Implementación de `justify-content: center` dentro del entorno visual `.hero-visual` asegurando el centrado simétrico absoluto de sorteos de múltiple longitud (ej. Loto Mas vs Loto Real).
  - Inyección de gradientes inferiores (Fade to Black) y animaciones unitarias del *wrapper* para lograr transiciones corporativas prístinas.
- **Interactividad Intuitiva (Botonización del Hero)**:
  - Acoplamiento semántico del contenedor del banner para responder como un CTA masivo (`cursor: pointer`), empalmado directamente al interceptor `window.navigateSpa(e, provider, drawName)`.
- **Saneamiento UI (Subpáginas)**:
  - Erradicación global de insignias redundantes color Carmesí (`PREMIO ACUMULATIVO`) en los encabezados internos para priorizar una lectura jerárquica más dócil y elegante.

### 22 de Marzo, 2026 - Despliegue Render, Arquitectura SEO (SSR) y Mejoras UX
- **Generador Automático de Jugadas (RNG Ponderado)**:
  - Implementación de un algoritmo estadístico propio en el backend (Node.js) que cruza la data histórica en vivo (`loteria.db`) de números "Calientes" (Top 10), "Fríos" y "Recientes" para producir sugerencias jugables inteligentes.
  - Creación de una experiencia inmersiva UI estilo Tragamonedas (`#view-generador`) en `index.ejs` con animaciones de cálculo para elevar la fricción psicológica premium.
  - Incorporación de Descargos de Responsabilidad (Disclaimer) para blindar legalmente la plataforma ante el uso de sugerencias al azar.
- **Despliegue en Producción (Render & GitHub)**:
  - Configuración de repositorio en GitHub (`santanalenin731-lang/loto-Live-RD`) e integración continua.
  - Desarrollo de `render-build.sh` para la correcta instalación y evasión de dependencias de Puppeteer/Chromium en el entorno Linux de Render.
  - Creación de endpoint interno `/ping` acoplado con cron-job.org exterior para ejecutar pings cada 10 minutos, asegurando que la instancia gratuita de Render nunca hiberne.
- **Arquitectura Híbrida SSR (Server-Side Rendering)**:
  - Migración del master layout de `index.html` hacia el motor `index.ejs`.
  - Configuración de Express (`server.js`) para interceptar rutas semánticas nativas (ej. `/loterias/nacional/gana-mas`).
  - Inyección dinámica en el servidor de `<title>`, meta `description` orientadas a SEO y datos estructurados Schema JSON-LD (`@type: "Event"`) para la aparición como Rich Snippets de lotería en Google.
  - Pase de estado transparente (`window.INITIAL_ROUTE`) para que el cliente Single Page Application hydrate y monte la vista sin dobles recargas.
- **Enlazado "Hub & Spoke" (Clean URLs)**:
  - Extirpación total de anclas tipo hash (`#lottery...`) a favor de URLs estructurales y semánticas en todo `app.js` y las 10 plantillas internas de proveedores.
  - Creación de un interceptor de navegación SPA (`history.pushState` + `navigateSpa`) que captura los clicks del usuario y previene recargas, combinando excelente UX con perfecta accesibilidad para rastreadores (crawlers).
  - Desarrollo y publicación de un sitemap XML backend dinámico (`/sitemap.xml`) reflejado directamente en `robots.txt`.
- **Rendimiento Optimo (TTFB & Caching)**:
  - Incorporación de middleware Node `compression` para comprimir Gzip/Brotli al vuelo.
  - Inyección de cabeceras estáticas agresivas `Cache-Control` (7 días para assets visuales) e inteligentes (5 minutos para los endpoints `/api/resultados` y `/api/predictions`).
- **Resolución de Conflictos en Producción (Render)**:
  - **Optimización de Memoria (Anti-Crash):** Reducción de la concurrencia de Puppeteer en el proceso `backfillAll` (`batchSize = 1` y pausas de 7 segundos) para prevenir desbordamientos de RAM (OOM) en la capa gratuita de Render (Límite 512MB), evitando errores 502 Bad Gateway.
  - **Indexación de Assets Ocultos:** Corrección de ficheros `.png` e `.jpg` que no estaban rastreados por Git, forzando la subida de 49 imágenes vitales al repositorio base para su exposición en producción.
  - **Bypassing y Cache Busting:** Reestructuración de la arquitectura de la SPA inyectando las URLs relativas unificadas (`/api/results/latest`) y añadiendo sub-versiones obligatorias (`app.js?v=1.1`) para forzar la invalidación del agresivo caché de Safari, asegurando la propagación inmediata de los fixes a todos los dispositivos.
- **Sistema Visual de Tandas y Status (Badges)**:
  - Se inyectó lógica dinámica en el renderizado de tarjetas (`buildCardHtml` en `js/app.js`) para categorizar el estatus del sorteo a primera vista.
  - Implementación de **etiquetas de tiempo**: Identificadores con íconos para saber si un sorteo listado pertenece a la categoría de **Mañana (☀️)**, **Tarde (🌤️)**, o **Noche (🌙)**.
  - Implementación de **alertas de actualidad Inteligentes**: La etiqueta ("Salió Hoy" / "De Ayer") ahora contrasta algorítmicamente la hora actual con el `schedule` oficial (Ej. `7:55 PM`) preveniendo falsos positivos de sorteos pendientes cuyas ejecuciones extractoras pre-oficiales arrastren fecha y guarden "Hoy" en la base de datos de madrugada.
- **Distribución de Grupos por Proveedor (Todas)**:
  - Estructuración dinámica del Home mediante *Glass Panels* masivos (`.glass-panel`). Cada proveedor fue encapsulado en un bloque gigante y unificado con su título estilizado (`<h2 class="provider-block-title">`), erradicando el caos de tarjetas infinitas por una organización limpia, por "Islas".
- **Navegación Unificada Inmersiva**:
  - Eliminación del genérico botón de listado "Volver" renderizado vía JavaScript.
  - Se potenció el imagotipo universal ("Loto Live RD") en la barra de navegación principal (`index.html` y subpáginas de estadísticas) con un *handler* transparente de `history.back()`, permitiendo a los usuarios retornar desde cualquier embudo (proveedores o Data Center) tocando la marca, tal como en una SPA premium.
- **Inyección Masiva de SEO (Loterias RD SEO Master)**:
  - Transformación profunda (+300 palabras robustas) de las pestañas "Cómo Jugar y Premios" para las 10 rutas de loterías registradas (`nacional`, `leidsa`, `loteka`, `real`, `la_primera`, `la_suerte`, `lotedom`, `usa`, `anguila`, `king_lottery`).
  - Cumplimiento cabal de la norma SEO: introducción geolocalizada, horarios definidos en bullet-points y explicaciones claras de sus jackpots para aplastar la competencia en búsquedas orgánicas sobre lotos dominicanas.
- **Armonía Corporativa en Estadísticas**:
  - Corrección de kerning estructural ("LotoLiveRD" -> "Loto Live RD").
  - Adopción absoluta del *Dark Theme / Glassmorphism* premium en la página de *Números Calientes / Fríos / Pronósticos*, garantizando concordancia con las imágenes corporativas provistas.


### 21 de Marzo, 2026 - Rebranding a Loto Live RD e Integración de King Lottery
- **Integración Total de King Lottery (10 Sorteos)**:
  - Inserción de configuración frontend (`app.js`) y tasks cron (`cronManager.js`) para abarcar la cartelera completa: Pick 3 (Día/Noche), Pick 4 (Día/Noche), Philipsburg (Día/Noche), Loto Pool (Día/Noche) y King Lottery regular.
  - Calibración del algoritmo de recolección para leer variaciones dinámicas de longitud (Ej. captura de 4 números para sorteos "Pick 4", "Agarra 4").
- **Asignación de Logotipos Oficiales (Americanas y Caribeñas)**:
  - Enlace de imágenes nativas del servidor en `assets/images/logos/` a sus respectivos proveedores, dotando de personalidad a sorteos que antes portaban escudos genéricos.
  - Loterías actualizadas: Americanas (New York, Florida, Mega Millions, Powerball), Anguila (4 ediciones diarias) y King Lottery.
- **Transición de Marca Global (Rebranding a Loto Live RD)**:
  - Cambio rotundo de naming y descripciones SEO en toda la plataforma: de "Loterías RD" a "Loto Live RD" (`index.html`, subpáginas, `robots.txt`, `js/app.js`, etc.).
  - Inserción del imagotipo `LotoliveRD.png` en el navbar principal en lugar de íconos genéricos, ajustado a `height: 40px` (+25%).
  - Aplicación de diseño CSS Inline en títulos de cabecera/pie corporativos: Loto (`#3b82f6` Azul), Live (`#ffffff` Blanco), RD (`#ef4444` Rojo).

### 19 de Marzo, 2026 - Expansión Masiva de Lotteries y Mejoras de UX
- **Rediseño del Dashboard**:
  - Nueva fuente tipográfica: Outfit (reemplaza Inter) para mejor legibilidad.
  - Badge "En Vivo" animado y estadísticas de confianza en el hero.
  - Layout reorganizado con skeleton loading states.
  
- **Sistema de Filtros Avanzado**:
  - Filtro por proveedor: Nacional, LEIDSA, Loteka, Real, La Primera, La Suerte, LoteDom, Americanas, Anguila, King Lottery.
  - Filtro por horario: Mañana, Tarde, Noche.
  - Filtro por categoría: Quiniela, Sorteo, Jackpot, Internacional, Caribe.

- **Expansión de `LOTTERY_META`** (de ~10 a 50+ loterías):
  - **Loteka**: Quiniela, Mega Chances, MegaLotto, Toca 3, Mega Chances Repartidera.
  - **Nacional**: Quiniela, Juega + Pega +, Lotería Nacional Noche.
  - **LEIDSA**: Quiniela, Pega 3 Más, Loto Pool, Super Kino TV, Loto/Super Loto Más, Super Palé.
  - **Real**: Quiniela, Tu Fecha Real, Pega 4, Nueva Yol, Loto Pool, Super Palé, Loto Real.
  - **La Primera**: Quinielón Día/Noche, La Primera Día/Noche, Loto 5 (Jackpot).
  - **LoteDom**: Quiniela, El Quemaito Mayor, Super Palé, Agarra 4.
  - **Americanas**: NY Tarde/Noche, Florida Día/Noche, Mega Millions, PowerBall, Powerball Double Play.
  - **Caribeñas**: King Lottery 12:30 PM y 7:30 PM.

- **Novedades Backend**:
  - `db.js`: Nuevas funciones para estadísticas: `getHotNumbers`, `getColdNumbers`, `getNumberHistory`, `getResultsByDate`, `getPredictions`.
  - `cronManager.js`: 
    - Timeout de 50s por scraper para liberar memoria.
    - Procesamiento en lotes de 4 scrapers simultáneos.
    - Scraper nuevo `realTracker.js` para extraer desde Conectate.
    - Scraper universal mejorado con bloqueo de imágenes/fonts (optimización).
  - `lotekaTracker.js`: Mejoras de resiliencia con `--disable-dev-shm-usage`, interceptores de requests.

- **Páginas de Proveedor** (`pages/providers/`):
  - Actualización completa de: nacional.html, leidsa.html, loteka.html, real.html.
  - Nuevos sorteos mapeados en: la_primera.html, la_suerte.html, lotedom.html.
  - Estructura de tarjetas mejorada con logos, colores por proveedor y tipos.

### 18 de Marzo, 2026 - Mejora de Branding y Corrección de Loteka
- **Identidad Visual**: Implementación de logos translúcidos (watermarks) en todas las tarjetas de resultados para Nacional, LEIDSA y Loteka.
- **Normalización de Activos**: Renombre de archivos de imagen para eliminar espacios y asegurar compatibilidad web (ej. `super_kino_tv.webp`).
- **Fix "Mega Chances Repartidera"**: 
  - Se añadió soporte para capturar el número único de la Repartidera.
  - Actualización del scraper `lotekaTracker.js` para diferenciar correctamente el sorteo principal del especial.
  - Mapeo completo en el frontend para mostrar ambos resultados sin duplicidad.
