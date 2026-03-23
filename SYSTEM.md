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

---

## 📝 Registro de Actualizaciones Recientes

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
