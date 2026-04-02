const cron = require('node-cron');
const scrapeLoteka = require('./scraper/lotekaTracker');
const scrapeAggregator = require('./scraper/universalTracker');
const scrapeNacionalOfficial = require('./scraper/nacionalOfficial');
const scrapeLeidsaOfficial = require('./scraper/leidsaOfficial');
const scrapeRealOfficial = require('./scraper/realOfficial');

// --- PRIMARY OFFICIAL SOURCES ---

const scrapeGanaMas = () => scrapeNacionalOfficial('Gana Más', 'nacional');
const scrapeJuegaPegaMas = () => scrapeNacionalOfficial('Juega + Pega +', 'nacional_juega_pega_mas');
const scrapeNacionalNoche = () => scrapeNacionalOfficial('Lotería Nacional', 'nacional_noche');
const scrapeNacionalBilletesDomingo = () => scrapeNacionalOfficial('Billetes Domingo', 'nacional_billetes_domingo');

const scrapeLeidsa = () => scrapeLeidsaOfficial('Quiniela Leidsa', 'leidsa');
const scrapeLeidsaPega3 = () => scrapeLeidsaOfficial('Pega 3 Más', 'leidsa_pega_3_mas');
const scrapeLeidsaLotoPool = () => scrapeLeidsaOfficial('Loto Pool', 'leidsa_loto_pool');
const scrapeLeidsaSuperKino = () => scrapeLeidsaOfficial('Super Kino TV', 'leidsa_super_kino_tv');
const scrapeLeidsaLoto = () => scrapeLeidsaOfficial('Loto - Super Loto Más', 'leidsa_loto');
const scrapeLeidsaSuperPale = () => scrapeLeidsaOfficial('Super Palé', 'leidsa_super_pale');

const scrapeReal = () => scrapeRealOfficial('Quiniela Real', 'real');
const scrapeRealTuFecha = () => scrapeRealOfficial('Tu Fecha Real', 'real_tu_fecha');
const scrapeRealPega4 = () => scrapeRealOfficial('Pega 4 Real', 'real_pega_4');
const scrapeRealNuevaYol = () => scrapeRealOfficial('Nueva Yol Real', 'real_nueva_yol');
const scrapeRealLotoPool = () => scrapeRealOfficial('Loto Pool', 'real_loto_pool');
const scrapeRealLoto = () => scrapeRealOfficial('Loto Real', 'real_loto');
const scrapeRealSuperPale = () => scrapeRealOfficial('Super Palé', 'real_super_pale');

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
                // REDUCED RETRY INTERVAL TO 20 SECONDS FOR MAXIMUM SPEED
                console.log(`[QUEUE] Re-queueing ${scraperFunc.name} for attempt ${attempts + 2} in 20s...`);
                setTimeout(() => {
                    scraperQueue.push({ scraperFunc, broadcastCb, maxRetries, attempts: attempts + 1 });
                    processQueue(); // Ensure queue runs after timeout
                }, 20000); 
            } else {
                console.log(`[QUEUE] Max retries reached for ${scraperFunc.name}. Giving up.`);
            }
        }

        // Reduced pause between executions to keep the queue moving fast
        console.log(`[QUEUE] Pausing 2 seconds to free Chromium RAM...`);
        await new Promise(res => setTimeout(res, 2000));
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
    /* --- Loterías Clásicas (SINCRONIZACIÓN OFICIAL) --- */
    
    // Loteka 7:55 PM -> Start 7:54 PM
    scheduleDraw('54 19 * * *', () => {
        runWithRetries(scrapeLoteka, broadcastCb, 120);
    }); 

    // Nacional Tarde (Gana Mas) 3:00 PM -> Start 2:59 PM
    scheduleDraw('59 14 * * *', () => {
        runWithRetries(scrapeGanaMas, broadcastCb, 120);
        runWithRetries(scrapeJuegaPegaMas, broadcastCb, 120);
        runWithRetries(scrapeNYTarde, broadcastCb, 120);
    }); 

    // Nacional Noche 8:55 PM -> Start 8:54 PM
    scheduleDraw('54 20 * * 1-6', () => {
        runWithRetries(scrapeNacionalNoche, broadcastCb, 120);
    }); 

    // Nacional Noche & Billetes Domingo 6:00 PM -> Start 5:58 PM
    scheduleDraw('58 17 * * 0', () => {
        runWithRetries(scrapeNacionalNoche, broadcastCb, 120);
        runWithRetries(scrapeNacionalBilletesDomingo, broadcastCb, 120);
    }); 

    // Leidsa 8:55 PM -> Start 8:54 PM
    scheduleDraw('54 20 * * 1-6', () => {
        runWithRetries(scrapeLeidsa, broadcastCb, 120);
        runWithRetries(scrapeLeidsaPega3, broadcastCb, 120);
        runWithRetries(scrapeLeidsaLotoPool, broadcastCb, 120);
        runWithRetries(scrapeLeidsaSuperKino, broadcastCb, 120);
        runWithRetries(scrapeLeidsaLoto, broadcastCb, 120);
        runWithRetries(scrapeLeidsaSuperPale, broadcastCb, 120);
    }); 

    // Leidsa Domingo 5:55 PM -> Start 5:54 PM
    scheduleDraw('54 17 * * 0', () => {
        runWithRetries(scrapeLeidsa, broadcastCb, 120);
        runWithRetries(scrapeLeidsaPega3, broadcastCb, 120);
        runWithRetries(scrapeLeidsaLotoPool, broadcastCb, 120);
        runWithRetries(scrapeLeidsaSuperKino, broadcastCb, 120);
        runWithRetries(scrapeLeidsaSuperPale, broadcastCb, 120);
    }); 

    // Real 12:55 PM -> Start 12:54 PM
    scheduleDraw('54 12 * * *', () => {
        runWithRetries(scrapeReal, broadcastCb, 120);
        runWithRetries(scrapeRealTuFecha, broadcastCb, 120);
        runWithRetries(scrapeRealPega4, broadcastCb, 120);
        runWithRetries(scrapeRealNuevaYol, broadcastCb, 120);
        runWithRetries(scrapeRealLotoPool, broadcastCb, 120);
        runWithRetries(scrapeRealLoto, broadcastCb, 120);
        runWithRetries(scrapeRealSuperPale, broadcastCb, 120);
    }); 

    /* --- Loterías Privadas Adicionales --- */
    
    // La Primera 12:00 PM -> Start 11:59 AM
    scheduleDraw('59 11 * * *', () => {
        runWithRetries(scrapePrimeraDia, broadcastCb, 120);
        runWithRetries(scrapePrimeraQuinielonDia, broadcastCb, 120);
    }); 

    // La Primera 8:00 PM -> Start 7:59 PM
    scheduleDraw('59 19 * * *', () => {
        runWithRetries(scrapePrimeraNoche, broadcastCb, 120);
        runWithRetries(scrapePrimeraLoto5, broadcastCb, 120);
        runWithRetries(scrapePrimeraQuinielonNoche, broadcastCb, 120);
    }); 

    // Suerte 12:30 PM & 6:00 PM
    scheduleDraw('29 12 * * *', () => runWithRetries(scrapeSuerteDia, broadcastCb, 120)); 
    scheduleDraw('59 17 * * *', () => runWithRetries(scrapeSuerteTarde, broadcastCb, 120)); 

    // LoteDom 1:55 PM -> Start 1:54 PM
    scheduleDraw('54 13 * * *', () => {
        runWithRetries(scrapeLotedom, broadcastCb, 120);
        runWithRetries(scrapeLotedomQuemaito, broadcastCb, 120);
        runWithRetries(scrapeLotedomSuperPale, broadcastCb, 120);
        runWithRetries(scrapeLotedomAgarra4, broadcastCb, 120);
    }); 

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
    const now = new Date();
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

    console.log(`🚀 [BACKFILL] Starting smart backfill for date: ${today}`);

    // Get current results from DB for today
    const existingDraws = await new Promise((resolve) => {
        const db_lib = require('./db');
        db_lib.getResultsByDate(today, (err, rows) => resolve(err ? [] : rows));
    });

    const existingCodes = existingDraws.map(d => d.lottery_code);
    console.log(`[BACKFILL] Found ${existingCodes.length} draws already present today.`);

    const allScrapers = [
        { func: scrapeGanaMas, code: 'nacional' },
        { func: scrapeNacionalNoche, code: 'nacional_noche' },
        { func: scrapeJuegaPegaMas, code: 'nacional_juega_pega_mas' },
        { func: scrapeLoteka, code: 'loteka' }, // Loteka returns array, but the main code is 'loteka'
        { func: scrapeLeidsa, code: 'leidsa' },
        { func: scrapeLeidsaPega3, code: 'leidsa_pega_3_mas' },
        { func: scrapeLeidsaLotoPool, code: 'leidsa_loto_pool' },
        { func: scrapeLeidsaSuperKino, code: 'leidsa_super_kino_tv' },
        { func: scrapeLeidsaLoto, code: 'leidsa_loto' },
        { func: scrapeLeidsaSuperPale, code: 'leidsa_super_pale' },
        { func: scrapeReal, code: 'real' },
        { func: scrapeRealTuFecha, code: 'real_tu_fecha' },
        { func: scrapeRealPega4, code: 'real_pega_4' },
        { func: scrapeRealNuevaYol, code: 'real_nueva_yol' },
        { func: scrapeRealLotoPool, code: 'real_loto_pool' },
        { func: scrapeRealLoto, code: 'real_loto' },
        { func: scrapeRealSuperPale, code: 'real_super_pale' },
        { func: scrapePrimeraDia, code: 'primera_dia' },
        { func: scrapePrimeraNoche, code: 'primera_noche' },
        { func: scrapePrimeraLoto5, code: 'primera_loto_5' },
        { func: scrapePrimeraQuinielonDia, code: 'primera_quinielon_dia' },
        { func: scrapePrimeraQuinielonNoche, code: 'primera_quinielon_noche' },
        { func: scrapeSuerteDia, code: 'suerte_dia' },
        { func: scrapeSuerteTarde, code: 'suerte_tarde' },
        { func: scrapeLotedom, code: 'lotedom' },
        { func: scrapeLotedomQuemaito, code: 'lotedom_quemaito_mayor' },
        { func: scrapeLotedomSuperPale, code: 'lotedom_super_pale' },
        { func: scrapeLotedomAgarra4, code: 'lotedom_agarra_4' },
        { func: scrapeNYTarde, code: 'ny_tarde' },
        { func: scrapeNYNoche, code: 'ny_noche' },
        { func: scrapeFLDia, code: 'fl_dia' },
        { func: scrapeFLNoche, code: 'fl_noche' },
        { func: scrapeMegaMillions, code: 'mega_millions' },
        { func: scrapePowerball, code: 'powerball' },
        { func: scrapePowerballDP, code: 'powerball_double_play' },
        { func: scrapeAnguila10, code: 'anguila_10' },
        { func: scrapeAnguila1, code: 'anguila_1' },
        { func: scrapeAnguila6, code: 'anguila_6' },
        { func: scrapeAnguila9, code: 'anguila_9' },
        { func: scrapeKingPick3Dia, code: 'king_pick_3_dia' },
        { func: scrapeKingPick4Dia, code: 'king_pick_4_dia' },
        { func: scrapeKing12, code: 'king_12' },
        { func: scrapeKingPhilipsburgDia, code: 'king_philipsburg_dia' },
        { func: scrapeKingLotoPoolDia, code: 'king_loto_pool_dia' },
        { func: scrapeKingPick3Noche, code: 'king_pick_3_noche' },
        { func: scrapeKingPick4Noche, code: 'king_pick_4_noche' },
        { func: scrapeKing7, code: 'king_7' },
        { func: scrapeKingPhilipsburgNoche, code: 'king_philipsburg_noche' },
        { func: scrapeKingLotoPoolNoche, code: 'king_loto_pool_noche' }
    ];

    const toScrape = allScrapers.filter(s => !existingCodes.includes(s.code));
    console.log(`[BACKFILL] Pending scrapers to run: ${toScrape.length}`);

    if (toScrape.length === 0) {
        console.log('✅ [BACKFILL] All results for today are already present. Skipping backfill.');
        return;
    }

    // Process only what's missing in batches of 1 to avoid OOM
    for (let i = 0; i < toScrape.length; i++) {
        const item = toScrape[i];
        try {
            console.log(`[BACKFILL] Fetching missing: ${item.code}`);
            const result = await item.func();
            const resultsArray = Array.isArray(result) ? result : (result ? [result] : []);

            if (resultsArray.length > 0 && broadcastCb) {
                const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });
                resultsArray.forEach(r => {
                    if (r.lotteryCode && r.numbers) {
                        broadcastCb(r.lotteryCode, r.numbers, drawTime);
                    }
                });
            }
        } catch (err) {
            console.error(`[BACKFILL] Error fetching ${item.code}: ${err.message}`);
        }

        // Keep a small pause to avoid saturating CPU
        if (i < toScrape.length - 1) {
            await new Promise(res => setTimeout(res, 3000)); // Only 3 seconds if we have a lot to catch up
        }
    }
    console.log('✅ [BACKFILL] Finished initial data population.');
}

module.exports = { initializeCrons, backfillAll };
