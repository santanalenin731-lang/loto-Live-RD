const puppeteer = require('puppeteer');
const db = require('../db');

/**
 * Scrapes Anguila Lottery from its official portal https://anguillalottery.ai/
 * @param {string} targetTime - Time of the draw (e.g., '10:00AM', '1:00PM', '5:00PM', '9:00PM')
 * @param {string} dbLotteryCode - DB code to save the result
 * @returns {Promise<Array<string>|null>}
 */
async function scrapeAnguilaOfficial(targetTime, dbLotteryCode) {
    const url = 'https://anguillalottery.ai/';
    console.log(`[OFFICIAL ANGUILA] Attacking ${targetTime} at ${url}...`);
    
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

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });
        
        // Wait 3 seconds for JS execution just in case
        await new Promise(res => setTimeout(res, 3000));

        const now = new Date();
        const drawDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

        const result = await page.evaluate((targetTime) => {
            // Helper to clean time string
            const cleanTime = (t) => t.replace(/\s+/g, '').toLowerCase();
            const cleanTarget = cleanTime(targetTime);
            
            // 1. Check if it is the main big draw on top
            const mainHeader = document.querySelector('.result-sorteo .horassorteo');
            if (mainHeader && cleanTime(mainHeader.innerText).includes(cleanTarget)) {
                const parent = mainHeader.closest('.result-sorteo');
                const numSpans = Array.from(parent.querySelectorAll('.bolas-sorteo .numero'));
                if (numSpans.length >= 3) {
                    return numSpans.slice(0, 3).map(span => {
                        const clone = span.cloneNode(true);
                        const small = clone.querySelector('.small');
                        if (small) small.remove();
                        return clone.textContent.trim();
                    });
                }
            }
            
            // 2. Check in the other draws list
            const otros = Array.from(document.querySelectorAll('.otro-sorteo'));
            for (let otro of otros) {
                const fechaDiv = otro.querySelector('.fecha');
                if (fechaDiv && cleanTime(fechaDiv.innerText).includes(cleanTarget)) {
                    const numSpans = Array.from(otro.querySelectorAll('.numero'));
                    if (numSpans.length >= 3) {
                        return numSpans.slice(0, 3).map(span => {
                            const clone = span.cloneNode(true);
                            const small = clone.querySelector('.small');
                            if (small) small.remove();
                            return clone.textContent.trim();
                        });
                    }
                }
            }
            return null;
        }, targetTime);

        if (result && result.length >= 3) {
            console.log(`[OFFICIAL ANGUILA] SUCCESS! ${targetTime}:`, result);
            const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });
            
            return new Promise((resolve, reject) => {
                db.saveResult(dbLotteryCode, drawDate, drawTime, result, (err, lastID) => {
                    if (err) {
                        console.error(`[OFFICIAL ANGUILA] DB save failed for ${dbLotteryCode}:`, err.message);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        } else {
            console.log(`[OFFICIAL ANGUILA] Result for ${targetTime} not posted yet.`);
            return null;
        }
    } catch (e) {
        console.error(`[OFFICIAL ANGUILA] Error scraping ${targetTime}:`, e.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { scrapeAnguilaOfficial };
