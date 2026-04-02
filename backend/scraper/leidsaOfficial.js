const puppeteer = require('puppeteer');
const db = require('../db');

/**
 * OFFICIAL SCRAPER: LEIDSA (La Fabrica de Millonarios)
 * Source: https://leidsa.com
 * This goes directly to the results dashboard of the official Leidsa portal.
 */
async function scrapeLeidsaOfficial(targetGame, lotteryCode) {
    const url = 'https://leidsa.com/resultados/';
    console.log(`[OFFICIAL LEIDSA] Attacking ${targetGame} at ${url}...`);

    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36');
        
        // Block assets for speed
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
            else req.continue();
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

        const now = new Date();
        const drawDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

        // LEIDSA uses cards labeled with game names (Quiniela, Loto, etc.)
        const result = await page.evaluate((target) => {
            const cards = Array.from(document.querySelectorAll('.chakra-card, div[role="group"], .leidsa-result-card'));
            
            for (let card of cards) {
                const text = card.innerText || "";
                if (text.toLowerCase().includes(target.toLowerCase())) {
                    // Extract numbers from circles/spans inside this specific card
                    const numbers = Array.from(card.querySelectorAll('span, div'))
                        .map(n => n.innerText.trim())
                        .filter(t => t.length > 0 && t.length <= 2 && !isNaN(t));

                    if (numbers.length >= 1) return numbers;
                }
            }
            return null;
        }, targetGame);

        if (result && result.length > 0) {
            console.log(`[OFFICIAL LEIDSA] SUCCESS! ${targetGame}:`, result);
            const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });

            return new Promise((resolve, reject) => {
                db.saveResult(lotteryCode, drawDate, drawTime, result, (err) => {
                    if (err && !err.message.includes('SQLITE_CONSTRAINT')) reject(err);
                    else resolve({ lotteryCode, numbers: result });
                });
            });
        } else {
            console.log(`[OFFICIAL LEIDSA] Result for ${targetGame} not posted yet.`);
            return null;
        }

    } catch (error) {
        console.error(`[OFFICIAL LEIDSA] Error:`, error.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = scrapeLeidsaOfficial;
