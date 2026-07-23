const puppeteer = require('puppeteer');
const db = require('../db');

/**
 * Scrapes American Lotteries from LoteriasDominicanas unifed portal (to avoid NY geoblock)
 * @param {string} targetTitle - Name of the draw (e.g., 'New York Tarde', 'New York Noche', 'Florida Día', 'Florida Noche')
 * @param {string} dbLotteryCode - DB code to save the result
 * @returns {Promise<Array<string>|null>}
 */
async function scrapeAmericanasOfficial(targetTitle, dbLotteryCode) {
    const url = 'https://loteriasdominicanas.com/';
    console.log(`[OFFICIAL AMERICANAS] Attacking ${targetTitle} at ${url}...`);
    
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
        
        // Wait 2 seconds for JS execution
        await new Promise(res => setTimeout(res, 2000));

        const now = new Date();
        const drawDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
        const expectedDateStr = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Santo_Domingo', month: '2-digit', day: '2-digit' }).format(now).replace(/\//g, '-'); // e.g. "22-07"

        const result = await page.evaluate((targetTitle, expectedDate) => {
            const cards = Array.from(document.querySelectorAll('a.flex.flex-col.gap-3.p-5'));
            for (let card of cards) {
                const titleDiv = card.querySelector('.text-xl.font-bold div, .text-xl.font-bold');
                if (titleDiv && titleDiv.innerText.trim().toLowerCase() === targetTitle.toLowerCase()) {
                    // Validate date inside card
                    const cardText = card.innerText.trim();
                    if (!cardText.includes(expectedDate)) {
                        return null; // Return null to retry if not today's draw
                    }
                    const ballSpans = Array.from(card.querySelectorAll('.score-shape-circle span'));
                    if (ballSpans.length >= 3) {
                        return ballSpans.map(s => s.innerText.trim()).filter(t => t.length > 0 && !isNaN(t));
                    }
                }
            }
            return null;
        }, targetTitle, expectedDateStr);

        if (result && result.length >= 3) {
            console.log(`[OFFICIAL AMERICANAS] SUCCESS! ${targetTitle}:`, result);
            const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });
            
            return new Promise((resolve, reject) => {
                db.saveResult(dbLotteryCode, drawDate, drawTime, result, (err, lastID) => {
                    if (err) {
                        console.error(`[OFFICIAL AMERICANAS] DB save failed for ${dbLotteryCode}:`, err.message);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        } else {
            console.log(`[OFFICIAL AMERICANAS] Result for ${targetTitle} not posted yet.`);
            return null;
        }
    } catch (e) {
        console.error(`[OFFICIAL AMERICANAS] Error scraping ${targetTitle}:`, e.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { scrapeAmericanasOfficial };
