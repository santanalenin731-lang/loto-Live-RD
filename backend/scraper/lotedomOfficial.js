const puppeteer = require('puppeteer');
const db = require('../db');

/**
 * Scrapes LoteDom from its official portal https://lotedom.com/
 * @param {string} targetGame - Name of the draw (e.g., 'Quiniela LoteDom', 'El Quemaito Mayor', 'Agarralo 4', 'Super Palé LoteDom')
 * @param {string} dbLotteryCode - DB code to save the result
 * @returns {Promise<Array<string>|null>}
 */
async function scrapeLotedomOfficial(targetGame, dbLotteryCode) {
    const url = 'https://lotedom.com/';
    console.log(`[OFFICIAL LOTEDOM] Attacking ${targetGame} at ${url}...`);
    
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36');
        
        // Speed optimization: Block unnecessary resources
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
            else req.continue();
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for element and ensure Angular hydration has a bit of time to complete
        await page.waitForSelector('.cardResultados', { timeout: 15000 });
        await new Promise(res => setTimeout(res, 3500));

        const now = new Date();
        const drawDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
        const expectedDateStr = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now).replace(/\//g, '-'); // e.g. "22-07-2026"

        const result = await page.evaluate((targetGame, expectedDate) => {
            const card = document.querySelector('.cardResultados');
            if (!card) return null;
            
            // Validate date inside card
            const cardText = card.innerText.trim();
            if (cardText && !cardText.includes(expectedDate)) {
                return null; // Old results, retry
            }
            
            if (targetGame === 'Quiniela LoteDom') {
                const row = card.querySelector('.resultados_fondo_oscuro');
                if (row) {
                    const balls = Array.from(row.querySelectorAll('.numeros_bolas'));
                    if (balls.length >= 3) {
                        return balls.slice(0, 3).map(b => b.textContent.trim());
                    }
                }
            } else if (targetGame === 'El Quemaito Mayor') {
                const ball = card.querySelector('.num_bola_roja');
                if (ball) {
                    return [ball.textContent.trim()];
                }
            } else if (targetGame === 'Agarralo 4') {
                // Agarralo 4 is composed of the 3 Quiniela balls plus the Quemaito ball
                const row = card.querySelector('.resultados_fondo_oscuro');
                const quemaitoBall = card.querySelector('.num_bola_roja');
                if (row && quemaitoBall) {
                    const balls = Array.from(row.querySelectorAll('.numeros_bolas'));
                    if (balls.length >= 3) {
                        const quiniela = balls.slice(0, 3).map(b => b.textContent.trim());
                        const quemaito = quemaitoBall.textContent.trim();
                        if (quiniela.every(n => n.length > 0) && quemaito.length > 0) {
                            return [...quiniela, quemaito];
                        }
                    }
                }
            } else if (targetGame === 'Super Palé LoteDom') {
                const rows = Array.from(card.querySelectorAll('.resultados_fondo_oscuro'));
                if (rows.length >= 2) {
                    const row = rows[1];
                    const pair = row.querySelector('.div_bola_num');
                    if (pair) {
                        const spans = Array.from(pair.querySelectorAll('span'));
                        if (spans.length >= 2) {
                            return spans.map(s => s.textContent.trim());
                        }
                    }
                }
            }
            return null;
        }, targetGame, expectedDateStr);

        if (result && result.length >= 1) {
            console.log(`[OFFICIAL LOTEDOM] SUCCESS! ${targetGame}:`, result);
            const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });
            
            return new Promise((resolve, reject) => {
                db.saveResult(dbLotteryCode, drawDate, drawTime, result, (err, lastID) => {
                    if (err) {
                        console.error(`[OFFICIAL LOTEDOM] DB save failed for ${dbLotteryCode}:`, err.message);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        } else {
            console.log(`[OFFICIAL LOTEDOM] Result for ${targetGame} not posted yet.`);
            return null;
        }
    } catch (e) {
        console.error(`[OFFICIAL LOTEDOM] Error scraping ${targetGame}:`, e.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { scrapeLotedomOfficial };
