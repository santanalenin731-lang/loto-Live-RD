const cron = require('node-cron');
const scrapeLoteka = require('./scraper/lotekaTracker');
const scrapeAggregator = require('./scraper/universalTracker');
const scrapeRealConectate = require('./scraper/realTracker');

// Wrapper functions for the aggregator

const scrapeGanaMas = () => scrapeAggregator('Gana Más', 'nacional');
const scrapeJuegaPegaMas = () => scrapeAggregator('Juega + Pega +', 'nacional_juega_pega_mas');
const scrapeNacionalNoche = () => scrapeAggregator('Lotería Nacional', 'nacional_noche');
const scrapeNacionalBilletesDomingo = () => scrapeAggregator('Billetes Domingo', 'nacional_billetes_domingo', '/loteria-nacional/billetes-domingo');
const scrapeLeidsa = () => scrapeAggregator('Quiniela Leidsa', 'leidsa', '/leidsa');
const scrapeLeidsaPega3 = () => scrapeAggregator('Pega 3 Más', 'leidsa_pega_3_mas', '/leidsa');
const scrapeLeidsaLotoPool = () => scrapeAggregator('Loto Pool', 'leidsa_loto_pool', '/leidsa');
const scrapeLeidsaSuperKino = () => scrapeAggregator('Super Kino TV', 'leidsa_super_kino_tv', '/leidsa');
const scrapeLeidsaLoto = () => scrapeAggregator('Loto - Super Loto Más', 'leidsa_loto', '/leidsa');
const scrapeLeidsaSuperPale = () => scrapeAggregator('Super Palé', 'leidsa_super_pale', '/leidsa');
const scrapeReal = () => scrapeRealConectate('Quiniela Real', 'real');
const scrapeRealTuFecha = () => scrapeRealConectate('Tu Fecha Real', 'real_tu_fecha');
const scrapeRealPega4 = () => scrapeRealConectate('Pega 4 Real', 'real_pega_4');
const scrapeRealNuevaYol = () => scrapeRealConectate('Nueva Yol Real', 'real_nueva_yol');
const scrapeRealLotoPool = () => scrapeRealConectate('Loto Pool', 'real_loto_pool');
const scrapeRealLoto = () => scrapeRealConectate('Loto Real', 'real_loto');
const scrapeRealSuperPale = () => scrapeRealConectate('Super Palé', 'real_super_pale');

// Nuevas Loterías (Full Coverage)
const scrapePrimeraDia = () => scrapeAggregator('La Primera Día', 'primera_dia');
const scrapePrimeraNoche = () => scrapeAggregator('Primera Noche', 'primera_noche');
const scrapePrimeraLoto5 = () => scrapeAggregator('Loto 5', 'primera_loto_5');
const scrapePrimeraQuinielonDia = () => scrapeAggregator('El Quinielón Día', 'primera_quinielon_dia', '/la-primera');
const scrapePrimeraQuinielonNoche = () => scrapeAggregator('El Quinielón Noche', 'primera_quinielon_noche', '/la-primera');
const scrapeSuerteDia = () => scrapeAggregator('La Suerte 12:30', 'suerte_dia');
const scrapeSuerteTarde = () => scrapeAggregator('La Suerte 18:00', 'suerte_tarde');
const scrapeLotedom = () => scrapeAggregator('Quiniela LoteDom', 'lotedom', '/lotedom');
const scrapeLotedomQuemaito = () => scrapeAggregator('El Quemaito Mayor', 'lotedom_quemaito_mayor', '/lotedom');
const scrapeLotedomSuperPale = () => scrapeAggregator('Super Palé', 'lotedom_super_pale', '/lotedom');
const scrapeLotedomAgarra4 = () => scrapeAggregator('Agarra 4', 'lotedom_agarra_4', '/lotedom');
const scrapeNYTarde = () => scrapeAggregator('New York Tarde', 'ny_tarde');
const scrapeNYNoche = () => scrapeAggregator('New York Noche', 'ny_noche');
const scrapeFLDia = () => scrapeAggregator('Florida Día', 'fl_dia');
const scrapeFLNoche = () => scrapeAggregator('Florida Noche', 'fl_noche');
const scrapeAnguila10 = () => scrapeAggregator('Anguila Mañana', 'anguila_10');
const scrapeAnguila1 = () => scrapeAggregator('Anguila Medio Día', 'anguila_1');
const scrapeAnguila6 = () => scrapeAggregator('Anguila Tarde', 'anguila_6');
const scrapeAnguila9 = () => scrapeAggregator('Anguila Noche', 'anguila_9');

const scrapeKingPick3Dia = () => scrapeAggregator('Pick 3 Día', 'king_pick_3_dia', '/king-lottery');
const scrapeKingPick4Dia = () => scrapeAggregator('Pick 4 Día', 'king_pick_4_dia', '/king-lottery');
const scrapeKing12 = () => scrapeAggregator('King Lottery 12:30', 'king_12', '/king-lottery');
const scrapeKingPhilipsburgDia = () => scrapeAggregator('Philipsburg Medio Día', 'king_philipsburg_dia', '/king-lottery');
const scrapeKingLotoPoolDia = () => scrapeAggregator('Loto Pool Medio Día', 'king_loto_pool_dia', '/king-lottery');

const scrapeKingPick3Noche = () => scrapeAggregator('Pick 3 Noche', 'king_pick_3_noche', '/king-lottery');
const scrapeKingPick4Noche = () => scrapeAggregator('Pick 4 Noche', 'king_pick_4_noche', '/king-lottery');
const scrapeKing7 = () => scrapeAggregator('King Lottery 7:30', 'king_7', '/king-lottery');
const scrapeKingPhilipsburgNoche = () => scrapeAggregator('Philipsburg Noche', 'king_philipsburg_noche', '/king-lottery');
const scrapeKingLotoPoolNoche = () => scrapeAggregator('Loto Pool Noche', 'king_loto_pool_noche', '/king-lottery');

const scrapeMegaMillions = () => scrapeAggregator('Mega Millions', 'mega_millions', '/americanas');
const scrapePowerball = () => scrapeAggregator('PowerBall', 'powerball', '/americanas');
const scrapePowerballDP = () => scrapeAggregator('Powerball Double Play', 'powerball_double_play', '/americanas');

console.log('📅 Initializing Cron Schedule Manager...');

// Global queue to prevent Out Of Memory (OOM) on free Render instance (512MB RAM)
// By restricting to 1 concurrent Puppeteer instance at all times.
const scraperQueue = [];
let isProcessingQueue = false;

async function processQueue() {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    while (scraperQueue.length > 0) {
        const { scraperFunc, broadcastCb, maxRetries, attempts } = scraperQueue.shift();

        console.log(`[QUEUE] Processing ${scraperFunc.name} (Attempt ${attempts + 1}/${maxRetries})...`);
        try {
            // Force timeout exactly at 50 seconds to free up
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Scraper Execution Timeout (50s)')), 50000));
            const result = await Promise.race([scraperFunc(), timeoutPromise]);

            // Handle both single result objects and arrays (e.g., Loteka returns an array)
            const resultsArray = Array.isArray(result) ? result : (result ? [result] : []);

            if (resultsArray.length > 0 && resultsArray[0].numbers && resultsArray[0].numbers.length > 0) {
                console.log(`[QUEUE] Success! Got ${resultsArray.length} result(s) for ${scraperFunc.name}. Broadcasting to WebSockets...`);
                const now = new Date();
                const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });
                if (broadcastCb) {
                    resultsArray.forEach(r => {
                        if (r.lotteryCode && r.numbers) {
                            broadcastCb(r.lotteryCode, r.numbers, drawTime);
                        }
                    });
                }
            } else {
                 throw new Error("No results obtained or site is not updated yet.");
            }
        } catch (error) {
            console.error(`[QUEUE] Error during ${scraperFunc.name}:`, error.message);
            if (attempts + 1 < maxRetries) {
                console.log(`[QUEUE] Re-queueing ${scraperFunc.name} for attempt ${attempts + 2} in 60s...`);
                setTimeout(() => {
                    scraperQueue.push({ scraperFunc, broadcastCb, maxRetries, attempts: attempts + 1 });
                    processQueue(); // Ensure queue runs after timeout
                }, 60000);
            } else {
                console.log(`[QUEUE] Max retries reached for ${scraperFunc.name}. Giving up.`);
            }
        }

        // 5 seconds pause between executions to help Garbage Collector free RAM
        console.log(`[QUEUE] Pausing 5 seconds to free Chromium RAM...`);
        await new Promise(res => setTimeout(res, 5000));
    }

    isProcessingQueue = false;
    console.log(`[QUEUE] Queue is now empty. Waiting for next cron task.`);
}

function runWithRetries(scraperFunc, broadcastCb, maxRetries = 20) {
    scraperQueue.push({ scraperFunc, broadcastCb, maxRetries, attempts: 0 });
    processQueue();
}

function scheduleDraw(time, task) {
    cron.schedule(time, task, { timezone: 'America/Santo_Domingo' });
}

function initializeCrons(broadcastCb) {
    /* --- Loterías Clásicas --- */
    scheduleDraw('05 20 * * *', () => {
        runWithRetries(scrapeLoteka, broadcastCb, 120);
    }); // Loteka 8:05 PM
    scheduleDraw('31 14 * * *', () => {
        runWithRetries(scrapeGanaMas, broadcastCb, 120);
        runWithRetries(scrapeJuegaPegaMas, broadcastCb, 120);
        runWithRetries(scrapeNYTarde, broadcastCb, 120);
    }); // Nacional Tarde & NY 2:31 PM

    scheduleDraw('56 20 * * *', () => {
        runWithRetries(scrapeNacionalNoche, broadcastCb, 120);
    }); // Nacional Noche 8:56 PM (Lunes-Sábado)

    scheduleDraw('05 18 * * 0', () => {
        runWithRetries(scrapeNacionalNoche, broadcastCb, 120);
        runWithRetries(scrapeNacionalBilletesDomingo, broadcastCb, 120);
    }); // Nacional Noche & Billetes Domingo 6:05 PM

    scheduleDraw('00 21 * * 1-6', () => {
        runWithRetries(scrapeLeidsa, broadcastCb, 120);
        runWithRetries(scrapeLeidsaPega3, broadcastCb, 120);
        runWithRetries(scrapeLeidsaLotoPool, broadcastCb, 120);
        runWithRetries(scrapeLeidsaSuperKino, broadcastCb, 120);
        runWithRetries(scrapeLeidsaLoto, broadcastCb, 120);
        runWithRetries(scrapeLeidsaSuperPale, broadcastCb, 120);
    }); // Leidsa 9:00 PM (Lunes-Sábado)

    scheduleDraw('05 18 * * 0', () => {
        runWithRetries(scrapeLeidsa, broadcastCb, 120);
        runWithRetries(scrapeLeidsaPega3, broadcastCb, 120);
        runWithRetries(scrapeLeidsaLotoPool, broadcastCb, 120);
        runWithRetries(scrapeLeidsaSuperKino, broadcastCb, 120);
        runWithRetries(scrapeLeidsaSuperPale, broadcastCb, 120);
    }); // Leidsa 6:05 PM (Domingo)

    scheduleDraw('05 13 * * *', () => {
        runWithRetries(scrapeReal, broadcastCb, 120);
        runWithRetries(scrapeRealTuFecha, broadcastCb, 120);
        runWithRetries(scrapeRealPega4, broadcastCb, 120);
        runWithRetries(scrapeRealNuevaYol, broadcastCb, 120);
        runWithRetries(scrapeRealLotoPool, broadcastCb, 120);
        runWithRetries(scrapeRealLoto, broadcastCb, 120);
        runWithRetries(scrapeRealSuperPale, broadcastCb, 120);
    }); // Real 1:05 PM

    /* --- Loterías Privadas Adicionales --- */
    scheduleDraw('05 12 * * *', () => {
        runWithRetries(scrapePrimeraDia, broadcastCb, 120);
        runWithRetries(scrapePrimeraQuinielonDia, broadcastCb, 120);
    }); // Primera 12:05 PM
    scheduleDraw('05 20 * * *', () => {
        runWithRetries(scrapePrimeraNoche, broadcastCb, 120);
        runWithRetries(scrapePrimeraLoto5, broadcastCb, 120);
        runWithRetries(scrapePrimeraQuinielonNoche, broadcastCb, 120);
    }); // Primera 8:05 PM
    scheduleDraw('35 12 * * *', () => runWithRetries(scrapeSuerteDia, broadcastCb, 120)); // Suerte 12:35 PM
    scheduleDraw('05 18 * * *', () => runWithRetries(scrapeSuerteTarde, broadcastCb, 120)); // Suerte 6:05 PM
    scheduleDraw('05 14 * * *', () => {
        runWithRetries(scrapeLotedom, broadcastCb, 120);
        runWithRetries(scrapeLotedomQuemaito, broadcastCb, 120);
        runWithRetries(scrapeLotedomSuperPale, broadcastCb, 120);
        runWithRetries(scrapeLotedomAgarra4, broadcastCb, 120);
    }); // LoteDom 2:05 PM

    /* --- Loterías Americanas --- */
    scheduleDraw('31 14 * * *', () => runWithRetries(scrapeNYTarde, broadcastCb, 120)); // NY 2:31 PM
    scheduleDraw('31 22 * * *', () => runWithRetries(scrapeNYNoche, broadcastCb, 120)); // NY 10:31 PM
    scheduleDraw('35 13 * * *', () => runWithRetries(scrapeFLDia, broadcastCb, 120)); // Flor 1:35 PM
    scheduleDraw('45 21 * * *', () => runWithRetries(scrapeFLNoche, broadcastCb, 120)); // Flor 9:45 PM

    scheduleDraw('15 23 * * *', () => {
        runWithRetries(scrapeMegaMillions, broadcastCb, 120);
        runWithRetries(scrapePowerball, broadcastCb, 120);
        runWithRetries(scrapePowerballDP, broadcastCb, 120);
    }); // USA Jackpots 11:15 PM
    
    scheduleDraw('05 10 * * *', () => runWithRetries(scrapeAnguila10, broadcastCb, 120)); // Anguila 10:05 AM
    scheduleDraw('05 13 * * *', () => runWithRetries(scrapeAnguila1, broadcastCb, 120)); // Anguila 1:05 PM
    scheduleDraw('05 18 * * *', () => runWithRetries(scrapeAnguila6, broadcastCb, 120)); // Anguila 6:05 PM
    scheduleDraw('05 21 * * *', () => runWithRetries(scrapeAnguila9, broadcastCb, 120)); // Anguila 9:05 PM
    
    scheduleDraw('35 12 * * *', () => {
        runWithRetries(scrapeKingPick3Dia, broadcastCb, 120);
        runWithRetries(scrapeKingPick4Dia, broadcastCb, 120);
        runWithRetries(scrapeKing12, broadcastCb, 120);
        runWithRetries(scrapeKingPhilipsburgDia, broadcastCb, 120);
        runWithRetries(scrapeKingLotoPoolDia, broadcastCb, 120);
    }); // King Day Draws 12:35 PM

    scheduleDraw('35 19 * * *', () => {
        runWithRetries(scrapeKingPick3Noche, broadcastCb, 120);
        runWithRetries(scrapeKingPick4Noche, broadcastCb, 120);
        runWithRetries(scrapeKing7, broadcastCb, 120);
        runWithRetries(scrapeKingPhilipsburgNoche, broadcastCb, 120);
        runWithRetries(scrapeKingLotoPoolNoche, broadcastCb, 120);
    }); // King Night Draws 7:35 PM

    // Demonstration/Testing cron: runs every 30 minutes in dev just to show it works
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
        scheduleDraw('*/30 * * * *', () => {
            console.log('⏱️ [DEV] Triggering test scrapes for ALL lotteries...');
            runWithRetries(scrapeLoteka, broadcastCb, 1);
            runWithRetries(scrapeGanaMas, broadcastCb, 1);
            runWithRetries(scrapeJuegaPegaMas, broadcastCb, 1);
            runWithRetries(scrapeReal, broadcastCb, 1);
            runWithRetries(scrapeRealTuFecha, broadcastCb, 1);
            runWithRetries(scrapeRealPega4, broadcastCb, 1);
            runWithRetries(scrapeRealNuevaYol, broadcastCb, 1);
            runWithRetries(scrapeRealLotoPool, broadcastCb, 1);
            runWithRetries(scrapeRealLoto, broadcastCb, 1);
            runWithRetries(scrapeRealSuperPale, broadcastCb, 1);
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
        scrapeGanaMas, scrapeNacionalNoche, scrapeJuegaPegaMas,
        scrapeLoteka,
        scrapeLeidsa, scrapeLeidsaPega3, scrapeLeidsaLotoPool, scrapeLeidsaSuperKino, scrapeLeidsaLoto, scrapeLeidsaSuperPale,
        scrapeReal, scrapeRealTuFecha, scrapeRealPega4, scrapeRealNuevaYol, scrapeRealLotoPool, scrapeRealLoto, scrapeRealSuperPale,
        scrapePrimeraDia, scrapePrimeraNoche, scrapePrimeraLoto5, scrapePrimeraQuinielonDia, scrapePrimeraQuinielonNoche,
        scrapeSuerteDia, scrapeSuerteTarde, 
        scrapeLotedom, scrapeLotedomQuemaito, scrapeLotedomSuperPale, scrapeLotedomAgarra4,
        scrapeNYTarde, scrapeNYNoche, scrapeFLDia, scrapeFLNoche,
        scrapeMegaMillions, scrapePowerball, scrapePowerballDP,
        scrapeAnguila10, scrapeAnguila1, scrapeAnguila6, scrapeAnguila9,
        scrapeKingPick3Dia, scrapeKingPick4Dia, scrapeKing12, scrapeKingPhilipsburgDia, scrapeKingLotoPoolDia,
        scrapeKingPick3Noche, scrapeKingPick4Noche, scrapeKing7, scrapeKingPhilipsburgNoche, scrapeKingLotoPoolNoche
    ];

    // Procesar en lotes de 1 para NO saturar la memoria RAM del servidor (Render Free Tier tiene solo 512MB RAM)
    const batchSize = 1;
    for (let i = 0; i < scrapers.length; i += batchSize) {
        const batch = scrapers.slice(i, i + batchSize);
        console.log(`[BACKFILL] Processing batch ${i / batchSize + 1} of ${Math.ceil(scrapers.length / batchSize)}...`);

        await Promise.all(batch.map(async (scraper) => {
            try {
                console.log(`[BACKFILL] Fetching: ${scraper.name}`);
                const result = await scraper();
                if (result && result.numbers && result.numbers.length > 0 && broadcastCb) {
                    const now = new Date();
                    const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });
                    broadcastCb(result.lotteryCode, result.numbers, drawTime);
                }
            } catch (err) {
                console.error(`[BACKFILL] Error fetching ${scraper.name}: ${err.message}`);
            }
        }));

        // Pausa Larga entre lotes para recolección de basura (Garbage Collection) y liberar Chromium
        if (i + batchSize < scrapers.length) {
            console.log('[BACKFILL] Pausing 7 seconds before next batch to free memory...');
            await new Promise(res => setTimeout(res, 7000));
        }
    }
    console.log('✅ [BACKFILL] Finished initial data population.');
}

module.exports = { initializeCrons, backfillAll };
