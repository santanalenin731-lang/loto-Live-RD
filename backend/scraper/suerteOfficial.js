const puppeteer = require('puppeteer');
const db = require('../db');

/**
 * Scrapes La Suerte Dominicana from its official portal https://lasuertedominicana.do/
 * @param {string} targetTime - Time of the draw (e.g., '12:30 PM', '6:00 PM')
 * @param {string} dbLotteryCode - DB code to save the result
 * @returns {Promise<Array<string>|null>}
 */
async function scrapeSuerteOfficial(targetTime, dbLotteryCode) {
    const url = 'https://lasuertedominicana.do/';
    console.log(`[OFFICIAL SUERTE] Attacking ${targetTime} at ${url}...`);
    
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
        
        // Wait 2 seconds for JS execution just in case
        await new Promise(res => setTimeout(res, 2000));

        const now = new Date();
        const drawDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
        const expectedDateStr = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now).replace(/\//g, '-'); // e.g. "22-07-2026"

        const result = await page.evaluate((targetTime, expectedDate) => {
            // Validate date first
            const dateEl = document.querySelector('.lr-date');
            if (dateEl) {
                const dateText = dateEl.innerText.trim();
                if (dateText && !dateText.includes(expectedDate)) {
                    return null; // Return null to retry if date does not match today
                }
            }

            const timeDivs = Array.from(document.querySelectorAll('.lr-draw-time'));
            const match = timeDivs.find(d => d.innerText && d.innerText.trim().includes(targetTime));
            if (match) {
                const parent = match.parentElement;
                const numbersDiv = parent.querySelector('.lr-numbers');
                if (numbersDiv) {
                    const balls = Array.from(numbersDiv.querySelectorAll('.lr-ball'));
                    const nums = balls.map(b => b.innerText.trim());
                    if (nums.length >= 3 && nums.every(n => n.length > 0 && !isNaN(n))) {
                        return nums;
                    }
                }
            }
            return null;
        }, targetTime, expectedDateStr);

        if (result && result.length >= 3) {
            console.log(`[OFFICIAL SUERTE] SUCCESS! ${targetTime}:`, result);
            const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });
            
            return new Promise((resolve, reject) => {
                db.saveResult(dbLotteryCode, drawDate, drawTime, result, (err, lastID) => {
                    if (err) {
                        console.error(`[OFFICIAL SUERTE] DB save failed for ${dbLotteryCode}:`, err.message);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        } else {
            console.log(`[OFFICIAL SUERTE] Result for ${targetTime} not posted or date mismatch yet.`);
            
            // Try fallback to loteriasdominicanas.com
            try {
                console.log(`[OFFICIAL SUERTE] Trying fallback to loteriasdominicanas.com for ${targetTime}...`);
                const { scrapeAmericanasOfficial } = require('./americanasOfficial');
                const fallbackTarget = targetTime.includes('12:30') ? 'La Suerte 12:30' : 'La Suerte 18:00';
                
                const fallbackResult = await scrapeAmericanasOfficial(fallbackTarget, dbLotteryCode);
                if (fallbackResult) {
                    console.log(`[OFFICIAL SUERTE] Fallback SUCCESS for ${targetTime}:`, fallbackResult);
                    return fallbackResult;
                }
            } catch (err) {
                console.error(`[OFFICIAL SUERTE] Fallback failed for ${targetTime}:`, err.message);
            }
            return null;
        }
    } catch (e) {
        console.error(`[OFFICIAL SUERTE] Error scraping ${targetTime}:`, e.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { scrapeSuerteOfficial };
