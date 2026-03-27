const puppeteer = require('puppeteer');
const db = require('../db');

/**
 * Universally scrapes the popular dominican aggregator 'loteriasdominicanas.com'
 * to reliably fetch results for any lottery by title name.
 */
async function scrapeAggregator(targetTitle, lotteryCode, sitePath = '/') {
    console.log(`[AGGREGATOR] Fetching ${targetTitle} from loteriasdominicanas.com${sitePath}...`);
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Previene crashes en Linux/VPS por falta de memoria compartida
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        // Optimizar cargas bloqueando imágenes y tipografías
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

        // Go to site and wait for primary network requests to finish
        // We set timeout to 45s since we blocked assets
        await page.goto(`https://loteriasdominicanas.com${sitePath}`, { waitUntil: 'domcontentloaded', timeout: 45000 });

        const now = new Date();
        const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Santo_Domingo', month: '2-digit', day: '2-digit' }).formatToParts(now);
        const day = parts.find(p => p.type === 'day').value;
        const month = parts.find(p => p.type === 'month').value;
        const expectedDate = `${day}-${month}`;

        // Extract numbers based on target title
        const numbers = await page.evaluate((title, expectedDate) => {
            const blocks = document.querySelectorAll('.game-block');
            for (let b of blocks) {
                const gameTitle = b.querySelector('.game-title')?.innerText.trim();

                if (gameTitle && gameTitle.toLowerCase().includes(title.toLowerCase())) {
                    // VALIDATOR: Ensure the date of this block matches today
                    let dateNode = b.querySelector('.session-date');
                    if (!dateNode) dateNode = document.querySelector('.session-date');
                    
                    if (dateNode) {
                        const dateText = dateNode.innerText.trim();
                        // If it doesn't contain current DD-MM, it's outdated data!
                        if (dateText && !dateText.includes(expectedDate)) {
                            return null; // Reject extraction, causing runWithRetries to fetch again later
                        }
                    }

                    return Array.from(b.querySelectorAll('.score, .ball')).map(n => n.innerText.trim());
                }
            }
            return null;
        }, targetTitle, expectedDate);

        // Dynamic slice length based the game type
        let maxLength = 3; // Default for Quinielas, Pega 3, etc.
        if (targetTitle.includes('Kino')) maxLength = 20;
        else if (targetTitle.includes('Loto - Super Loto')) maxLength = 8;
        else if (targetTitle.includes('MegaLotto')) maxLength = 8;
        else if (targetTitle.includes('Loto 5') || targetTitle.includes('Mega Millions') || targetTitle.includes('Powerball') || targetTitle.includes('PowerBall')) maxLength = 6;
        else if (targetTitle.includes('Loto Pool Medio Día') || targetTitle.includes('Loto Pool Noche')) maxLength = 4;
        else if (targetTitle.includes('Pool') || targetTitle.includes('Juega + Pega +') || targetTitle.includes('Mega Chances')) maxLength = 5;
        else if (targetTitle.includes('Palé')) maxLength = 2;
        else if (targetTitle.includes('Quemaito Mayor')) maxLength = 1;
        else if (targetTitle.includes('Agarra 4') || targetTitle.includes('Pick 4')) maxLength = 4;
        else if (targetTitle.includes('Billetes')) maxLength = 3;
        else if (targetTitle.includes('Quinielón')) maxLength = 1;

        // Validate we got actual numbers back and they meet the required length for this specific lottery
        if (numbers && numbers.length >= maxLength) {
            const finalNumbers = numbers.slice(0, maxLength);
            console.log(`[AGGREGATOR] Success! Extracted numbers for ${targetTitle}:`, finalNumbers);

            const drawDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
            const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });

            // Wrap db.saveResult in a promise to return the expected structure to cronManager
            return new Promise((resolve, reject) => {
                db.saveResult(lotteryCode, drawDate, drawTime, finalNumbers, (err) => {
                    if (err && !err.message.includes('SQLITE_CONSTRAINT')) {
                        console.error(`[AGGREGATOR] DB Error for ${lotteryCode}:`, err.message);
                        reject(err);
                    } else {
                        // SQLITE_CONSTRAINT means we already have today's results (e.g., duplicate cron run)
                        if (err && err.message.includes('SQLITE_CONSTRAINT')) {
                            console.log(`[AGGREGATOR] Notice: Results for ${targetTitle} already exist in DB for today.`);
                        } else {
                            console.log(`[AGGREGATOR] Database write success for ${targetTitle} (${lotteryCode}).`);
                        }

                        // Return the standardized format expected by WebSocket broadcaster
                        resolve({ lotteryCode, numbers: finalNumbers });
                    }
                });
            });
        } else {
            console.log(`[AGGREGATOR] Warning: Could not locate visual results block for ${targetTitle} today yet.`);
            return null;
        }
    } catch (error) {
        console.error(`[AGGREGATOR] HTTP/Puppeteer Scrape Error for ${targetTitle}:`, error.message);
        return null; // Return null so runWithRetries keeps trying
    } finally {
        if (browser) {
            const pages = await browser.pages();
            await Promise.all(pages.map(p => p.close())); // Cerrar todas las páginas explícitamente libera RAM
            await browser.close();
        }
    }
}

module.exports = scrapeAggregator;
