const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const db = require('./db');
const LOTTERY_META = require('./meta');
const { initializeCrons, backfillAll } = require('./cronManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(compression());

// --- 1. HEALTH CHECK & KEEP ALIVE (Highest Priority) ---
app.get('/ping', (req, res) => {
    console.log(`[KEEP-ALIVE] Ping received at ${new Date().toISOString()}`);
    res.status(200).send('p'); 
});

// Set up EJS for dynamic SEO Headers
app.set('views', path.join(__dirname, '../'));
app.set('view engine', 'ejs');

// --- SEO Dynamic Routes ---
app.get('/', (req, res) => {
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Loto Live RD",
        "url": "https://loto-live-rd.onrender.com/",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://loto-live-rd.onrender.com/?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    };
    const schemaScript = `<script type="application/ld+json">${JSON.stringify(websiteSchema)}</script>`;

    res.render('index.ejs', {
        title: "Resultados de Loto Live RD | Lotería Nacional, LEIDSA, Loteka y Más",
        description: "Resultados al instante de todas las loterías dominicanas. Lotería Nacional, LEIDSA, Loteka, Lotería Real, La Primera, LoteDom y New York. Revisa tus números y consulta nuestro diccionario de los sueños.",
        url: "https://loto-live-rd.onrender.com/",
        imageUrl: "https://loto-live-rd.onrender.com/assets/images/logos/LotoliveRD/LotoliveRD.png",
        initialScript: schemaScript
    });
});

app.get('/loterias/:provider/:drawID', (req, res) => {
    const providerStr = decodeURIComponent(req.params.provider).replace(/-/g, ' ');
    const drawStr = decodeURIComponent(req.params.drawID).replace(/-/g, ' ');

    // Uppercase first letters naturally
    const capitalize = (s) => s.replace(/\b\w/g, l => l.toUpperCase());
    const humanProvider = capitalize(providerStr);
    const humanDraw = capitalize(drawStr);

    const dateToday = new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Santo_Domingo' });
    const formattedDate = dateToday.replace(/\b\w/g, l => l.toUpperCase());

    const title = `${humanDraw} | Resultados de Hoy ${formattedDate} | Loto Live RD`;
    const description = `Revisa al instante los números ganadores de la Lotería ${humanDraw} de hoy en República Dominicana. Resultados 100% verificados en tiempo real. Ingresa ahora.`;

    // Generar JSON-LD Schema
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": `Resultados ${humanDraw} - ${humanProvider}`,
        "startDate": new Date().toISOString(),
        "location": {
            "@type": "Place",
            "name": "República Dominicana"
        },
        "description": description
    };
    const schemaScript = `<script type="application/ld+json">${JSON.stringify(schemaData)}</script>`;

    // Inject state to direct JS
    const initialScript = `<script>window.INITIAL_ROUTE = ${JSON.stringify({provider: humanProvider, draw: humanDraw})};</script>\n${schemaScript}`;

    const seoUrl = `https://loto-live-rd.onrender.com/loterias/${encodeURIComponent(req.params.provider)}/${encodeURIComponent(req.params.drawID)}`;

    res.render('index.ejs', {
        title: title,
        description: description,
        url: seoUrl,
        imageUrl: "https://loto-live-rd.onrender.com/assets/images/logos/LotoliveRD/LotoliveRD.png",
        initialScript: initialScript
    });
});

app.get('/acerca-de', (req, res) => {
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        "name": "Acerca de Loto Live RD",
        "url": "https://loto-live-rd.onrender.com/acerca-de",
        "description": "Conoce más sobre Loto Live RD, plataforma transparente e independiente de resultados de loterías en República Dominicana."
    };
    const schemaScript = `<script type="application/ld+json">${JSON.stringify(websiteSchema)}</script>`;

    res.render('acerca-de.ejs', {
        title: "Acerca de Nosotros | Loto Live RD",
        description: "En Loto Live RD recopilamos resultados de Lotería Nacional, LEIDSA, Loteka y más. Plataforma independiente sin relación a bancas de apuestas.",
        url: "https://loto-live-rd.onrender.com/acerca-de",
        imageUrl: "https://loto-live-rd.onrender.com/assets/images/logos/LotoliveRD/LotoliveRD.png",
        initialScript: schemaScript
    });
});

// --- Dynamic Sitemap Route ---
app.get('/sitemap.xml', (req, res) => {
    db.getLatestResults((err, results) => {
        if (err) return res.status(500).send('Error generating sitemap');
        
        res.header('Content-Type', 'application/xml');
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        
        xml += `  <url>\n    <loc>https://loto-live-rd.onrender.com/</loc>\n    <changefreq>always</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
        xml += `  <url>\n    <loc>https://loto-live-rd.onrender.com/acerca-de</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        
        results.forEach(lottery => {
            const meta = LOTTERY_META[lottery.lottery_code] || LOTTERY_META['default'];
            const urlSafeProvider = encodeURIComponent(meta.provider).toLowerCase().replace(/%20/g, '-');
            const urlSafeDraw = encodeURIComponent(meta.name).toLowerCase().replace(/%20/g, '-');
            const today = new Date().toISOString().split('T')[0];
            
            xml += `  <url>\n    <loc>https://loto-live-rd.onrender.com/loterias/${urlSafeProvider}/${urlSafeDraw}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        });
        
        xml += `</urlset>`;
        res.send(xml);
    });
});

// Serve the frontend static files with aggressive caching for assets
app.use(express.static(path.join(__dirname, '../'), {
    maxAge: '7d', // Cache static assets for 7 days
    setHeaders: function (res, filepath) {
        if (filepath.endsWith('.html') || filepath.endsWith('.ejs')) {
            // Do not cache HTML files aggressively to allow instant updates
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        }
    }
}));

// API Endpoints moved up for optimization

// API Endpoint to get current results
app.get('/api/results/latest', (req, res) => {
    db.getLatestResults((err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching results' });
        }
        res.json(results);
    });
});


// API: Force immediate scrape of all lotteries that have passed their schedule.
// Fixes stale data on Render without needing a server restart.
// Usage: GET https://loto-live-rd.onrender.com/api/force-scrape
app.get('/api/force-scrape', async (req, res) => {
    console.log('[FORCE-SCRAPE] Manual trigger received. Starting full refresh...');
    res.json({ status: 'started', message: 'Backfill iniciado. Recarga la pagina en 2 minutos.' });
    try {
        await backfillAll(broadcastNewResult);
        console.log('[FORCE-SCRAPE] Manual backfill complete.');
    } catch(e) {
        console.error('[FORCE-SCRAPE] Error:', e.message);
    }
});

// API: Hot Numbers (most frequent)
app.get('/api/stats/hot', (req, res) => {
    const days = parseInt(req.query.days) || 7;
    const limit = parseInt(req.query.limit) || 20;
    db.getHotNumbers(days, limit, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// API: Cold Numbers (least frequent)
app.get('/api/stats/cold', (req, res) => {
    const days = parseInt(req.query.days) || 7;
    const limit = parseInt(req.query.limit) || 20;
    db.getColdNumbers(days, limit, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// API: Number History (specific number audit trail)
app.get('/api/stats/number/:num', (req, res) => {
    const num = req.params.num;
    const days = parseInt(req.query.days) || 30;
    db.getNumberHistory(num, days, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// API: Results by date
app.get('/api/results/date/:date', (req, res) => {
    const date = req.params.date;
    db.getResultsByDate(date, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// API Endpoint para el Generador de Tickets Inteligentes
app.get('/api/generate-ticket', (req, res) => {
    Promise.all([
        new Promise((resolve, reject) => db.getHotNumbers(30, 20, (err, rows) => err ? reject(err) : resolve(rows))),
        new Promise((resolve, reject) => db.getColdNumbers(30, 20, (err, rows) => err ? reject(err) : resolve(rows))),
        new Promise((resolve, reject) => db.getLatestResults((err, rows) => err ? reject(err) : resolve(rows)))
    ])
    .then(([hotRows, coldRows, latestRows]) => {
        let weights = {};
        for(let i=0; i<=99; i++) {
            weights[i.toString().padStart(2, '0')] = 10; // Default weight
        }
        hotRows.forEach(r => { if(weights[r.number]) weights[r.number] += 15; });
        coldRows.forEach(r => { if(weights[r.number]) weights[r.number] += 5; });
        latestRows.forEach(draw => {
            try {
                const nums = typeof draw.numbers === 'string' ? JSON.parse(draw.numbers) : draw.numbers;
                nums.forEach(n => { if(weights[n]) weights[n] = 1; });
            } catch(e){}
        });

        let pool = [];
        for(let num in weights) {
            for(let i=0; i<weights[num]; i++) pool.push(num);
        }

        const picked = [];
        while(picked.length < 3) {
            if(pool.length === 0) break;
            const r = Math.floor(Math.random() * pool.length);
            const n = pool[r];
            if(!picked.includes(n)) {
                picked.push(n);
                pool = pool.filter(x => x !== n);
            }
        }
        res.json({ provider: req.query.provider || 'Nacional', numbers: picked });
    })
    .catch(err => {
        console.error("Error generating ticket:", err);
        const rng = [];
        while(rng.length < 3) {
            const s = Math.floor(Math.random()*100).toString().padStart(2, '0');
            if(!rng.includes(s)) rng.push(s);
        }
        res.json({ provider: req.query.provider || 'Nacional', numbers: rng });
    });
});

// API: Predictions (hot trend + overdue numbers)
app.get('/api/predictions', (req, res) => {
    db.getPredictions((err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});


// WebSocket connection for real-time updates
io.on('connection', (socket) => {
    console.log('A user connected via WebSocket', socket.id);

    // Optionally format and emit the current state on initial connection
    db.getLatestResults((err, results) => {
        if (!err && results.length > 0) {
            socket.emit('initial_data', results);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    });
});

// Function to trigger real-time updates to all connected clients
function broadcastNewResult(lotteryCode, numbers, drawTime) {
    const drawDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    io.emit('new_result', {
        lottery_code: lotteryCode,
        numbers: numbers,
        draw_time: drawTime,
        draw_date: drawDate,
        timestamp: new Date().toISOString()
    });
}

// Export for use in scrapers/cron
module.exports = { broadcastNewResult };

// Start the server
server.listen(PORT, () => {
    console.log(`🚀 Lottery Server running on http://localhost:${PORT}`);

    // Start Cron Jobs
    initializeCrons(broadcastNewResult);

    // Automatically perform an initial backfill without blocking the listener
    // Note: Do not await here so the server immediately serves requests while fetching
    backfillAll(broadcastNewResult);
});
