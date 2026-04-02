const cron = require('node-cron');
const scrapeLoteka = require('./scraper/lotekaTracker');
const scrapeAggregator = require('./scraper/universalTracker');
const scrapeNacionalOfficial = require('./scraper/nacionalOfficial');
const scrapeLeidsaOfficial = require('./scraper/leidsaOfficial');
const scrapeRealOfficial = require('./scraper/realOfficial');

// --- PRIMARY OFFICIAL SOURCES ---

// --- HYBRID SCRAPER FUNCTIONS (Official → Fallback to Aggregator) ---
// If the official source fails, we automatically fall back to the universal aggregator.

const scrapeGanaMas = async () => {
    const official = await scrapeNacionalOfficial('Gana Más', 'nacional');
    if (official) return official;
    console.log('[FALLBACK] Nacional Official failed for Gana Más, using aggregator...');
    return scrapeAggregator('Gana Más', 'nacional');
};
const scrapeJuegaPegaMas = async () => {
    const official = await scrapeNacionalOfficial('Juega + Pega +', 'nacional_juega_pega_mas');
    if (official) return official;
    console.log('[FALLBACK] Nacional Official failed for Juega Pega Mas, using aggregator...');
    return scrapeAggregator('Juega + Pega +', 'nacional_juega_pega_mas');
};
const scrapeNacionalNoche = async () => {
    const official = await scrapeNacionalOfficial('Lotería Nacional', 'nacional_noche');
    if (official) return official;
    console.log('[FALLBACK] Nacional Official failed for Nacional Noche, using aggregator...');
    return scrapeAggregator('Lotería Nacional', 'nacional_noche');
};
const scrapeNacionalBilletesDomingo = async () => {
    const official = await scrapeNacionalOfficial('Billetes Domingo', 'nacional_billetes_domingo');
    if (official) return official;
    console.log('[FALLBACK] Nacional Official failed for Billetes Domingo, using aggregator...');
    return scrapeAggregator('Billetes Domingo', 'nacional_billetes_domingo');
};

const scrapeLeidsa = async () => {
    const official = await scrapeLeidsaOfficial('Quiniela Leidsa', 'leidsa');
    if (official) return official;
    console.log('[FALLBACK] Leidsa Official failed, using aggregator...');
    return scrapeAggregator('Quiniela Leidsa', 'leidsa');
};
const scrapeLeidsaPega3 = async () => {
    const official = await scrapeLeidsaOfficial('Pega 3 Más', 'leidsa_pega_3_mas');
    if (official) return official;
    return scrapeAggregator('Pega 3 Más', 'leidsa_pega_3_mas');
};
const scrapeLeidsaLotoPool = async () => {
    const official = await scrapeLeidsaOfficial('Loto Pool', 'leidsa_loto_pool');
    if (official) return official;
    return scrapeAggregator('Loto Pool', 'leidsa_loto_pool');
};
const scrapeLeidsaSuperKino = async () => {
    const official = await scrapeLeidsaOfficial('Super Kino TV', 'leidsa_super_kino_tv');
    if (official) return official;
    return scrapeAggregator('Super Kino TV', 'leidsa_super_kino_tv');
};
const scrapeLeidsaLoto = async () => {
    const official = await scrapeLeidsaOfficial('Loto - Super Loto Más', 'leidsa_loto');
    if (official) return official;
    return scrapeAggregator('Loto - Super Loto Más', 'leidsa_loto');
};
const scrapeLeidsaSuperPale = async () => {
    const official = await scrapeLeidsaOfficial('Super Palé', 'leidsa_super_pale');
    if (official) return official;
    return scrapeAggregator('Super Palé', 'leidsa_super_pale');
};

const scrapeReal = async () => {
    const official = await scrapeRealOfficial('Quiniela Real', 'real');
    if (official) return official;
    console.log('[FALLBACK] Real Official failed, using aggregator...');
    return scrapeAggregator('Quiniela Real', 'real');
};
const scrapeRealTuFecha = async () => {
    const official = await scrapeRealOfficial('Tu Fecha Real', 'real_tu_fecha');
    if (official) return official;
    return scrapeAggregator('Tu Fecha Real', 'real_tu_fecha');
};
const scrapeRealPega4 = async () => {
    const official = await scrapeRealOfficial('Pega 4 Real', 'real_pega_4');
    if (official) return official;
    return scrapeAggregator('Pega 4 Real', 'real_pega_4');
};
const scrapeRealNuevaYol = async () => {
    const official = await scrapeRealOfficial('Nueva Yol Real', 'real_nueva_yol');
    if (official) return official;
    return scrapeAggregator('Nueva Yol Real', 'real_nueva_yol');
};
const scrapeRealLotoPool = async () => {
    const official = await scrapeRealOfficial('Loto Pool', 'real_loto_pool');
    if (official) return official;
    return scrapeAggregator('Loto Pool', 'real_loto_pool');
};
const scrapeRealLoto = async () => {
    const official = await scrapeRealOfficial('Loto Real', 'real_loto');
    if (official) return official;
    return scrapeAggregator('Loto Real', 'real_loto');
};
const scrapeRealSuperPale = async () => {
    const official = await scrapeRealOfficial('Super Palé', 'real_super_pale');
    if (official) return official;
    return scrapeAggregator('Super Palé', 'real_super_pale');
};

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

    // Get current RD time in minutes for schedule comparison
    const rdParts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Santo_Domingo', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(now);
    const rdHour = parseInt(rdParts.find(p => p.type === 'hour').value);
    const rdMinute = parseInt(rdParts.find(p => p.type === 'minute').value);
    const rdTotalMinutes = rdHour * 60 + rdMinute;

    function parseScheduleMinutes(timeStr) {
        const match = timeStr && timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return -1;
        let h = parseInt(match[1]);
        const m = parseInt(match[2]);
        const period = match[3].toUpperCase();
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return h * 60 + m;
    }

    console.log(`\u001b[36m[BACKFILL] Startup refresh: ${today} | RD Time: ${rdHour}:${String(rdMinute).padStart(2,'0')}\u001b[0m`);

    // Get current results from DB for today
    const existingDraws = await new Promise((resolve) => {
        const db_lib = require('./db');
        db_lib.getResultsByDate(today, (err, rows) => resolve(err ? [] : rows));
    });
    const existingCodes = existingDraws.map(d => d.lottery_code);
    console.log(`[BACKFILL] Found ${existingCodes.length} draws already in DB for today.`);

    // Full scraper registry with scheduled draw times
    const allScrapers = [
        { func: scrapeAnguila10,             code: 'anguila_10',               schedule: '10:00 AM' },
        { func: scrapePrimeraDia,            code: 'primera_dia',              schedule: '11:00 AM' },
        { func: scrapeSuerteDia,             code: 'suerte_dia',               schedule: '12:30 PM' },
        { func: scrapeKingPick3Dia,          code: 'king_pick_3_dia',          schedule: '12:30 PM' },
        { func: scrapeKingPick4Dia,          code: 'king_pick_4_dia',          schedule: '12:30 PM' },
        { func: scrapeKing12,                code: 'king_12',                  schedule: '12:30 PM' },
        { func: scrapeKingPhilipsburgDia,    code: 'king_philipsburg_dia',     schedule: '12:30 PM' },
        { func: scrapeKingLotoPoolDia,       code: 'king_loto_pool_dia',       schedule: '12:30 PM' },
        { func: scrapeAnguila1,              code: 'anguila_1',                schedule: '1:00 PM'  },
        { func: scrapeFLDia,                 code: 'fl_dia',                   schedule: '1:30 PM'  },
        { func: scrapeReal,                  code: 'real',                     schedule: '12:55 PM' },
        { func: scrapeRealTuFecha,           code: 'real_tu_fecha',            schedule: '12:55 PM' },
        { func: scrapeRealPega4,             code: 'real_pega_4',              schedule: '12:55 PM' },
        { func: scrapeRealNuevaYol,          code: 'real_nueva_yol',           schedule: '12:55 PM' },
        { func: scrapeRealLotoPool,          code: 'real_loto_pool',           schedule: '12:55 PM' },
        { func: scrapeRealSuperPale,         code: 'real_super_pale',          schedule: '12:55 PM' },
        { func: scrapeGanaMas,               code: 'nacional',                 schedule: '2:30 PM'  },
        { func: scrapeJuegaPegaMas,          code: 'nacional_juega_pega_mas',  schedule: '2:30 PM'  },
        { func: scrapePrimeraQuinielonDia,   code: 'primera_quinielon_dia',    schedule: '3:00 PM'  },
        { func: scrapeNYTarde,               code: 'ny_tarde',                 schedule: '3:30 PM'  },
        { func: scrapeLotedom,               code: 'lotedom',                  schedule: '5:30 PM'  },
        { func: scrapeLotedomQuemaito,       code: 'lotedom_quemaito_mayor',   schedule: '5:30 PM'  },
        { func: scrapeLotedomSuperPale,      code: 'lotedom_super_pale',       schedule: '5:30 PM'  },
        { func: scrapeLotedomAgarra4,        code: 'lotedom_agarra_4',         schedule: '5:30 PM'  },
        { func: scrapeAnguila6,              code: 'anguila_6',                schedule: '6:00 PM'  },
        { func: scrapeSuerteTarde,           code: 'suerte_tarde',             schedule: '6:00 PM'  },
        { func: scrapeNacionalBilletesDomingo, code: 'nacional_billetes_domingo', schedule: '6:00 PM' },
        { func: scrapeKingPick3Noche,        code: 'king_pick_3_noche',        schedule: '7:30 PM'  },
        { func: scrapeKingPick4Noche,        code: 'king_pick_4_noche',        schedule: '7:30 PM'  },
        { func: scrapeKing7,                 code: 'king_7',                   schedule: '7:30 PM'  },
        { func: scrapeKingPhilipsburgNoche,  code: 'king_philipsburg_noche',   schedule: '7:30 PM'  },
        { func: scrapeKingLotoPoolNoche,     code: 'king_loto_pool_noche',     schedule: '7:30 PM'  },
        { func: scrapeLoteka,                code: 'loteka',                   schedule: '7:55 PM'  },
        { func: scrapePrimeraNoche,          code: 'primera_noche',            schedule: '8:00 PM'  },
        { func: scrapePrimeraQuinielonNoche, code: 'primera_quinielon_noche',  schedule: '8:00 PM'  },
        { func: scrapePrimeraLoto5,          code: 'primera_loto_5',           schedule: '8:00 PM'  },
        { func: scrapeLeidsa,                code: 'leidsa',                   schedule: '8:55 PM'  },
        { func: scrapeLeidsaPega3,           code: 'leidsa_pega_3_mas',        schedule: '8:55 PM'  },
        { func: scrapeLeidsaLotoPool,        code: 'leidsa_loto_pool',         schedule: '8:55 PM'  },
        { func: scrapeLeidsaSuperKino,       code: 'leidsa_super_kino_tv',     schedule: '8:55 PM'  },
        { func: scrapeLeidsaLoto,            code: 'leidsa_loto',              schedule: '8:55 PM'  },
        { func: scrapeLeidsaSuperPale,       code: 'leidsa_super_pale',        schedule: '8:55 PM'  },
        { func: scrapeNacionalNoche,         code: 'nacional_noche',           schedule: '8:55 PM'  },
        { func: scrapeRealLoto,              code: 'real_loto',                schedule: '8:55 PM'  },
        { func: scrapeAnguila9,              code: 'anguila_9',                schedule: '9:00 PM'  },
        { func: scrapeFLNoche,               code: 'fl_noche',                 schedule: '9:45 PM'  },
        { func: scrapePowerball,             code: 'powerball',                schedule: '10:59 PM' },
        { func: scrapePowerballDP,           code: 'powerball_double_play',    schedule: '10:59 PM' },
        { func: scrapeNYNoche,               code: 'ny_noche',                 schedule: '10:30 PM' },
        { func: scrapeMegaMillions,          code: 'mega_millions',            schedule: '11:00 PM' },
    ];

    // KEY BEHAVIOR: Re-scrape every lottery whose draw time has already passed today.
    // Every server restart (e.g. triggered by saving code with node --watch) will
    // automatically refresh all results that should be available at this hour.
    const toScrape = allScrapers.filter(s => {
        const schedMins = parseScheduleMinutes(s.schedule);
        return schedMins >= 0 && rdTotalMinutes >= schedMins;
    });

    console.log(`[BACKFILL] Draw times passed: ${toScrape.length} lotteries to refresh.`);

    if (toScrape.length === 0) {
        console.log('✅ [BACKFILL] No draws have occurred yet today. Crons will handle them.');
        return;
    }

    for (let i = 0; i < toScrape.length; i++) {
        const item = toScrape[i];
        try {
            console.log(`[BACKFILL] [${i+1}/${toScrape.length}] Refreshing: ${item.code}`);
            const result = await item.func();
            const resultsArray = Array.isArray(result) ? result : (result ? [result] : []);

            if (resultsArray.length > 0 && broadcastCb) {
                const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });
                resultsArray.forEach(r => {
                    if (r.lotteryCode && r.numbers) broadcastCb(r.lotteryCode, r.numbers, drawTime);
                });
            }
        } catch (err) {
            console.error(`[BACKFILL] Error on ${item.code}: ${err.message}`);
        }

        // 2-second pause to avoid OOM on Render free tier
        if (i < toScrape.length - 1) {
            await new Promise(res => setTimeout(res, 2000));
        }
    }
    console.log('\u2705 [BACKFILL] Startup refresh complete. All passed draws updated.');
}

module.exports = { initializeCrons, backfillAll };
