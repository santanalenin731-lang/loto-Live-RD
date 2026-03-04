# Arquitectura y Garantías del "Universal Scraper"

El motor de extracción de resultados ha sido reescrito para no solo soportar todas las loterías dominicanas, americanas y caribeñas, sino para ser **prácticamente a prueba de fallos**. A continuación se documenta su lógica y las garantías de que el sistema no se va a "trabar".

## 1. Lógica de Extracción (El Web Scraper)

El núcleo del sistema vive en `backend/scraper/universalTracker.js`. Utiliza **Puppeteer** (un navegador Chrome invisible) para ir directo a un agregador de alta fidelidad (`loteriasdominicanas.com`).

**¿Cómo identifica los resultados correctamente?**
1. En lugar de depender de rutas URL específicas o IDs de HTML que suelen cambiar y romper los scrapers tradicionales, nuestro robot descarga la página principal y busca elementos visuales (`.game-block`).
2. Verifica **texto contra texto**. El sistema lee internamente el título (Ej: `"Anguila Mañana"`) y escanea la grid completa hasta encontrar la tarjeta exacta cuyo título coincida perfectamente de forma visual.
3. Al encontrar la tarjeta exacta, entra a ese bloque y extrae solo las pelotas con números (`.score`, `.ball`).

---

## 2. Garantías de Resiliencia (¿Por qué no va a dejar de funcionar?)

Si la página de destino se cae, si el internet del servidor falla por un segundo o si los resultados se retrasan en llegar al agregador, un scraper normal crashearía o detendría completamente tu servidor Node.js. 

Para evitar esto, construimos el **Poller Asíncrono con Reintentos (`runWithRetries`)** en `cronManager.js`:

### A) Aislamiento Estructural
- Cada raspado corre en su propia burbuja (`try/catch`). Si la Lotería "Anguila" falla, eso **nunca** detendrá ni hará crash al servidor principal ni afectará a la Lotería "Nacional" que corra después. El servidor Node.js sigue vivo enviando la data real que sí tiene en la DB.

### B) Mecanismo Caza-Retrasos (Polling de Supervivencia)
Los sorteos casi siempre se retrasan. 
- Si un raspado se dispara por Cron a las 3:00 PM pero la entidad no ha tirado los números, en lugar de rendirse, el scraper entra en **modo poller**.
- **Se configuraron hasta 30 reintentos (1 reintento por minuto)**. Esto significa que el robot seguirá acechando silenciosamente en el fondo durante los siguientes 30 minutos.
- Inmediatamente encuentre los números visualmente o expire su límite de tiempo, el proceso `setInterval` se auto-destruye y limpia la memoria (previene el "memory leak" o que la PC se trabe).

### C) Modo "Headless" Seguro Configurado
- Al invocar a Puppeteer le pasamos banderas importantes como `['--no-sandbox']` y `networkidle2`. Esto lo fuerza a ignorar contenido pesado irrelevante de anuncios y solo raspar una vez la web está estructuralmente cargada (hasta por 60 segundos antes de hacer throw), garantizando estabilidad del CPU de tu nube.

### D) Protector de la Base de Datos
- La base de datos `SQLite` está configurada con restricción **UNIQUE** por fecha y lotería (`lottery_code`, `draw_date`).
- Si por error el scraper captura los resultados dos veces hoy, la DB rechaza silenciosamente el segundo inserto (`SQLITE_CONSTRAINT`), previniendo corrupción de datos o pantallas con resultados duplicados.

---

## 3. Lista Estandarizada Soportada

Estas son las cuerdas de texto **exactas** que nuestra arquitectura tiene "pineadas" buscando su resultado para hoy:

**Mañana:**
1. `"La Primera Día"`
2. `"Anguila Mañana"`
3. `"King Lottery 12:30"`

**Tarde:**
4. `"La Suerte 12:30"`
5. `"Quiniela Real"`
6. `"Florida Día"`
7. `"Anguila Medio Día"`
8. `"Quiniela LoteDom"`
9. `"Gana Más"`
10. `"New York Tarde"`
11. `"La Suerte 18:00"`

**Noche:**
12. `"Anguila Tarde"` (6:00)
13. `"King Lottery 7:30"`
14. `"Quiniela Loteka"`
15. `"Primera Noche"`
16. `"Lotería Nacional"`
17. `"Quiniela Leidsa"`
18. `"Anguila Noche"`
19. `"Florida Noche"`
20. `"New York Noche"`
