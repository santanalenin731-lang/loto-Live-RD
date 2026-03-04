const cron = require('node-cron');
const scrapeLoteka = require('./scraper/lotekaTracker');
const scrapeAggregator = require('./scraper/universalTracker');

// Wrapper functions for the aggregator
const scrapeGanaMas = () => scrapeAggregator('Gana Más', 'nacional');
const scrapeNacionalNoche = () => scrapeAggregator('Lotería Nacional', 'nacional_noche');
const scrapeLeidsa = () => scrapeAggregator('Quiniela Leidsa', 'leidsa');
const scrapeReal = () => scrapeAggregator('Quiniela Real', 'real');

// Nuevas Loterías (Full Coverage)
const scrapePrimeraDia = () => scrapeAggregator('La Primera Día', 'primera_dia');
const scrapePrimeraNoche = () => scrapeAggregator('Primera Noche', 'primera_noche');
const scrapeSuerteDia = () => scrapeAggregator('La Suerte 12:30', 'suerte_dia');
const scrapeSuerteTarde = () => scrapeAggregator('La Suerte 18:00', 'suerte_tarde');
const scrapeLotedom = () => scrapeAggregator('Quiniela LoteDom', 'lotedom');
const scrapeNYTarde = () => scrapeAggregator('New York Tarde', 'ny_tarde');
const scrapeNYNoche = () => scrapeAggregator('New York Noche', 'ny_noche');
const scrapeFLDia = () => scrapeAggregator('Florida Día', 'fl_dia');
const scrapeFLNoche = () => scrapeAggregator('Florida Noche', 'fl_noche');
const scrapeAnguila10 = () => scrapeAggregator('Anguila Mañana', 'anguila_10');
const scrapeAnguila1 = () => scrapeAggregator('Anguila Medio Día', 'anguila_1');
const scrapeAnguila6 = () => scrapeAggregator('Anguila Tarde', 'anguila_6');
const scrapeAnguila9 = () => scrapeAggregator('Anguila Noche', 'anguila_9');
const scrapeKing12 = () => scrapeAggregator('King Lottery 12:30', 'king_12');
const scrapeKing7 = () => scrapeAggregator('King Lottery 7:30', 'king_7');

console.log('📅 Initializing Cron Schedule Manager...');

// Helper to run a scraper with retries if it fails to find results or the site is down
async function runWithRetries(scraperFunc, broadcastCb, maxRetries = 15) {
    let attempts = 0;

    // An interval that runs every 1 minute until success or max retries
    const poller = setInterval(async () => {
        attempts++;
        console.log(`[POLLER] Attempt ${attempts}/${maxRetries} for ${scraperFunc.name}...`);

        try {
            const result = await scraperFunc();
            if (result && result.numbers && result.numbers.length > 0) {
                console.log(`[POLLER] Success! Got results on attempt ${attempts}. Broadcasting to WebSockets...`);

                // Get current time
                const drawTime = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });

                // Alert connected frontends
                if (broadcastCb) broadcastCb(result.lotteryCode, result.numbers, drawTime);

                clearInterval(poller); // Stop polling for today
            } else if (attempts >= maxRetries) {
                console.log(`[POLLER] Max retries reached for ${scraperFunc.name}. Giving up.`);
                clearInterval(poller);
            }
        } catch (error) {
            console.error(`[POLLER] Error during attempt ${attempts}:`, error.message);
            if (attempts >= maxRetries) {
                clearInterval(poller);
            }
        }
    }, 60000); // 1 minute interval
}

function initializeCrons(broadcastCb) {
    /* --- Loterías Clásicas --- */
    cron.schedule('55 19 * * *', () => runWithRetries(scrapeLoteka, broadcastCb, 20)); // Loteka 7:55 PM
    cron.schedule('0 15 * * *', () => runWithRetries(scrapeGanaMas, broadcastCb, 20)); // Gana Más 3:00 PM
    cron.schedule('50 20 * * *', () => runWithRetries(scrapeNacionalNoche, broadcastCb, 20)); // Nac Noche 8:50 PM
    cron.schedule('55 20 * * *', () => runWithRetries(scrapeLeidsa, broadcastCb, 20)); // Leidsa 8:55 PM
    cron.schedule('55 12 * * *', () => runWithRetries(scrapeReal, broadcastCb, 20)); // Real 12:55 PM

    /* --- Loterías Privadas Adicionales --- */
    cron.schedule('0 12 * * *', () => runWithRetries(scrapePrimeraDia, broadcastCb, 20)); // Primera 12:00 PM
    cron.schedule('0 20 * * *', () => runWithRetries(scrapePrimeraNoche, broadcastCb, 20)); // Primera 8:00 PM
    cron.schedule('30 12 * * *', () => runWithRetries(scrapeSuerteDia, broadcastCb, 20)); // Suerte 12:30 PM
    cron.schedule('0 18 * * *', () => runWithRetries(scrapeSuerteTarde, broadcastCb, 20)); // Suerte 6:00 PM
    cron.schedule('55 13 * * *', () => runWithRetries(scrapeLotedom, broadcastCb, 20)); // Lotedom 1:55 PM

    /* --- Loterías Americanas --- */
    cron.schedule('30 15 * * *', () => runWithRetries(scrapeNYTarde, broadcastCb, 30)); // NY 3:30 PM
    cron.schedule('30 23 * * *', () => runWithRetries(scrapeNYNoche, broadcastCb, 30)); // NY 11:30 PM
    cron.schedule('30 13 * * *', () => runWithRetries(scrapeFLDia, broadcastCb, 30)); // Flor 1:30 PM
    cron.schedule('30 22 * * *', () => runWithRetries(scrapeFLNoche, broadcastCb, 30)); // Flor 10:30 PM

    /* --- Loterías Caribeñas --- */
    cron.schedule('0 10 * * *', () => runWithRetries(scrapeAnguila10, broadcastCb, 15)); // Anguila 10:00 AM
    cron.schedule('0 13 * * *', () => runWithRetries(scrapeAnguila1, broadcastCb, 15)); // Anguila 1:00 PM
    cron.schedule('0 18 * * *', () => runWithRetries(scrapeAnguila6, broadcastCb, 15)); // Anguila 6:00 PM
    cron.schedule('0 21 * * *', () => runWithRetries(scrapeAnguila9, broadcastCb, 15)); // Anguila 9:00 PM
    cron.schedule('30 12 * * *', () => runWithRetries(scrapeKing12, broadcastCb, 20)); // King 12:30 PM
    cron.schedule('30 19 * * *', () => runWithRetries(scrapeKing7, broadcastCb, 20)); // King 7:30 PM

    // Demonstration/Testing cron: runs every 30 minutes in dev just to show it works
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
        cron.schedule('*/30 * * * *', () => {
            console.log('⏱️ [DEV] Triggering test scrapes for ALL lotteries...');
            runWithRetries(scrapeLoteka, broadcastCb, 1);
            runWithRetries(scrapeGanaMas, broadcastCb, 1);
            runWithRetries(scrapeReal, broadcastCb, 1);
            runWithRetries(scrapePrimeraDia, broadcastCb, 1);
            runWithRetries(scrapeAnguila10, broadcastCb, 1);
            // Limitamos a unas 5 en DEV para no saturar 15 páginas rápidas en Puppeteer de golpe.
        });
    }

    console.log('✅ Cron Jobs scheduled successfully for 20 draws.');
}

async function backfillAll(broadcastCb) {
    console.log('🚀 [BACKFILL] Starting initial backfill to populate empty DB...');
    const scrapers = [
        scrapeGanaMas, scrapeNacionalNoche, scrapeLeidsa, scrapeReal,
        scrapePrimeraDia, scrapePrimeraNoche, scrapeSuerteDia, scrapeSuerteTarde, scrapeLotedom,
        scrapeNYTarde, scrapeNYNoche, scrapeFLDia, scrapeFLNoche,
        scrapeAnguila10, scrapeAnguila1, scrapeAnguila6, scrapeAnguila9,
        scrapeKing12, scrapeKing7, scrapeLoteka
    ];

    for (const scraper of scrapers) {
        try {
            console.log(`[BACKFILL] Fetching: ${scraper.name}`);
            const result = await scraper();
            if (result && result.numbers && result.numbers.length > 0 && broadcastCb) {
                const drawTime = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
                broadcastCb(result.lotteryCode, result.numbers, drawTime);
            }
        } catch (err) {
            console.error(`[BACKFILL] Error fetching ${scraper.name}: ${err.message}`);
        }
    }
    console.log('✅ [BACKFILL] Finished initial data population.');
}

module.exports = { initializeCrons, backfillAll };
