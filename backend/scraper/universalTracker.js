const puppeteer = require('puppeteer');
const db = require('../db');

/**
 * Universally scrapes the popular dominican aggregator 'loteriasdominicanas.com'
 * to reliably fetch results for any lottery by title name.
 */
async function scrapeAggregator(targetTitle, lotteryCode) {
    console.log(`[AGGREGATOR] Fetching ${targetTitle} from loteriasdominicanas.com...`);
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

        // Go to site and wait for primary network requests to finish
        // We set timeout to 60s to account for slow connections
        await page.goto('https://loteriasdominicanas.com/', { waitUntil: 'networkidle2', timeout: 60000 });

        // Extract numbers based on target title
        const numbers = await page.evaluate((title) => {
            const blocks = document.querySelectorAll('.game-block');
            for (let b of blocks) {
                const gameTitle = b.querySelector('.game-title')?.innerText.trim();

                // Direct match or partial match (e.g. if time/tags are appended)
                if (gameTitle === title || (gameTitle && gameTitle.includes(title))) {
                    return Array.from(b.querySelectorAll('.score, .ball')).map(n => n.innerText.trim());
                }
            }
            return null;
        }, targetTitle);

        // Validate we got actual numbers back
        if (numbers && numbers.length >= 2) {
            // We slice at 3 for standard Quinielas if the aggregator accidentally includes extra balls
            const finalNumbers = numbers.slice(0, 3);
            console.log(`[AGGREGATOR] Success! Extracted numbers for ${targetTitle}:`, finalNumbers);

            const drawDate = new Date().toISOString().split('T')[0];
            const drawTime = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });

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
        await browser.close();
    }
}

module.exports = scrapeAggregator;
