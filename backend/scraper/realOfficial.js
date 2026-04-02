const puppeteer = require('puppeteer');
const db = require('../db');

/**
 * OFFICIAL SCRAPER: Loto Real
 * Source: https://www.lotoreal.com.do/
 * Direct access to the Quasar-driven dashboard.
 */
async function scrapeRealOfficial(targetGame, lotteryCode) {
    const url = 'https://www.lotoreal.com.do/';
    console.log(`[OFFICIAL REAL] Attacking ${targetGame} at ${url}...`);

    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36');

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

        const now = new Date();
        const drawDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

        // Real uses styled balls labeled with specific game codes.
        const result = await page.evaluate((target) => {
            // Find "bolas" inside the results container.
            const containers = Array.from(document.querySelectorAll('.q-card, div.row'));
            
            for (let container of containers) {
                const text = container.innerText || "";
                if (text.toLowerCase().includes(target.toLowerCase())) {
                    // Extract numbers from elements with class .bolo or .bolo.shadow-10
                    const balls = Array.from(container.querySelectorAll('.bolo, .text-bold span'))
                        .map(b => b.innerText.trim())
                        .filter(t => t.length > 0 && t.length <= 2 && !isNaN(t));

                    if (balls.length >= 1) return balls;
                }
            }
            return null;
        }, targetGame);

        if (result && result.length > 0) {
            console.log(`[OFFICIAL REAL] SUCCESS! ${targetGame}:`, result);
            const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });

            return new Promise((resolve, reject) => {
                db.saveResult(lotteryCode, drawDate, drawTime, result, (err) => {
                    if (err && !err.message.includes('SQLITE_CONSTRAINT')) reject(err);
                    else resolve({ lotteryCode, numbers: result });
                });
            });
        } else {
            console.log(`[OFFICIAL REAL] Result for ${targetGame} not posted yet on the official site.`);
            return null;
        }

    } catch (error) {
        console.error(`[OFFICIAL REAL] Error:`, error.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = scrapeRealOfficial;
