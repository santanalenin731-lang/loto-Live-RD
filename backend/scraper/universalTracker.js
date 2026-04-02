const puppeteer = require('puppeteer');
const db = require('../db');

/**
 * High-speed scraper for Conectate.com.do - The fastest source for DR Lottery results.
 */
async function scrapeAggregator(targetTitle, lotteryCode, sitePath = '/') {
    // Standardize path for Conectate
    const fullUrl = `https://www.conectate.com.do/loterias${sitePath}`;
    console.log(`[CONECTATE TRACKER] Fetching ${targetTitle} from ${fullUrl}...`);
    
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

        // Speed optimization: wait only for DOM
        await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

        const now = new Date();
        const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Santo_Domingo', month: '2-digit', day: '2-digit' }).formatToParts(now);
        const day = parts.find(p => p.type === 'day').value;
        const month = parts.find(p => p.type === 'month').value;
        const expectedDate = `${day}-${month}`;

        // Extraction logic optimized for Conectate structure
        const numbers = await page.evaluate((title, expectedDate) => {
            const blocks = document.querySelectorAll('.game-block');
            for (let b of blocks) {
                const titleNode = b.querySelector('.game-title');
                if (!titleNode) continue;
                
                const gameTitle = titleNode.innerText.trim();

                if (gameTitle.toLowerCase().includes(title.toLowerCase())) {
                    // DATE VALIDATOR: Critical for "Real-Time" honesty
                    const dateNode = b.querySelector('.session-date') || document.querySelector('.session-date');
                    if (dateNode) {
                        const dateText = dateNode.innerText.trim();
                        // If date doesn't match today, it's old news. Return null to trigger retry.
                        if (dateText && !dateText.includes(expectedDate)) {
                            return null;
                        }
                    }

                    // Extract all numbers inside the block
                    const scores = Array.from(b.querySelectorAll('.score, .ball')).map(n => n.innerText.trim());
                    // Filter out empty strings or non-numeric if necessary
                    return scores.filter(s => s.length > 0);
                }
            }
            return null;
        }, targetTitle, expectedDate);

        // Dynamic validation based on game type
        let maxLength = 3;
        if (targetTitle.includes('Kino')) maxLength = 20;
        else if (targetTitle.includes('Loto - Super Loto')) maxLength = 8;
        else if (targetTitle.includes('Pega 3')) maxLength = 3;
        else if (targetTitle.includes('Loto Pool')) maxLength = 4;
        else if (targetTitle.includes('Juega + Pega +')) maxLength = 5;
        else if (targetTitle.includes('Palé')) maxLength = 2;
        else if (targetTitle.includes('Quemaito')) maxLength = 1;
        else if (targetTitle.includes('Agarra 4') || targetTitle.includes('Pick 4')) maxLength = 4;
        else if (targetTitle.includes('Billetes')) maxLength = 3;
        else if (targetTitle.includes('Quinielón')) maxLength = 1;

        if (numbers && numbers.length >= maxLength) {
            const finalNumbers = numbers.slice(0, maxLength);
            console.log(`[CONECTATE TRACKER] SUCCESS! Extracted ${targetTitle}:`, finalNumbers);

            const drawDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
            const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });

            return new Promise((resolve, reject) => {
                db.saveResult(lotteryCode, drawDate, drawTime, finalNumbers, (err) => {
                    if (err && !err.message.includes('SQLITE_CONSTRAINT')) {
                        reject(err);
                    } else {
                        resolve({ lotteryCode, numbers: finalNumbers });
                    }
                });
            });
        } else {
            console.log(`[CONECTATE TRACKER] Info: Result for ${targetTitle} not yet available for ${expectedDate}.`);
            return null;
        }
    } catch (error) {
        console.error(`[CONECTATE TRACKER] Error for ${targetTitle}:`, error.message);
        return null;
    } finally {
        if (browser) {
            const pages = await browser.pages();
            await Promise.all(pages.map(p => p.close()));
            await browser.close();
        }
    }
}

module.exports = scrapeAggregator;

