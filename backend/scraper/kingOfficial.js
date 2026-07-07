const puppeteer = require('puppeteer');
const db = require('../db');

/**
 * Scrapes King Lottery Sint Maarten from its official portal https://www.kinglotterysxm.com/
 * @param {string} targetTitle - Name of the draw (e.g., 'Quiniela SXM - Medio Día', 'Quiniela SXM - Noche', 'Loto Pool SXM - Medio Día', 'Loto Pool SXM - Noche')
 * @param {string} dbLotteryCode - DB code to save the result
 * @returns {Promise<Array<string>|null>}
 */
async function scrapeKingOfficial(targetTitle, dbLotteryCode) {
    const url = 'https://www.kinglotterysxm.com/';
    console.log(`[OFFICIAL KING] Attacking ${targetTitle} at ${url}...`);
    
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
        
        // Wait 3 seconds for Elementor hydration
        await new Promise(res => setTimeout(res, 3000));

        const now = new Date();
        const drawDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

        const result = await page.evaluate((targetTitle) => {
            const headings = Array.from(document.querySelectorAll('h2.elementor-heading-title'));
            const heading = headings.find(h => h.innerText && h.innerText.trim().toLowerCase().includes(targetTitle.toLowerCase()));
            if (!heading) return null;
            
            const container = heading.closest('.e-con-inner');
            if (container) {
                const textEditors = Array.from(container.querySelectorAll('.elementor-widget-text-editor'));
                const balls = textEditors
                    .map(e => e.innerText.trim())
                    .filter(t => t.length > 0 && t.length <= 4 && !isNaN(t));
                
                if (balls.length > 0) {
                    return balls;
                }
            }
            return null;
        }, targetTitle);

        if (result && result.length >= 1) {
            console.log(`[OFFICIAL KING] SUCCESS! ${targetTitle}:`, result);
            const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });
            
            return new Promise((resolve, reject) => {
                db.saveResult(dbLotteryCode, drawDate, drawTime, result, (err, lastID) => {
                    if (err) {
                        console.error(`[OFFICIAL KING] DB save failed for ${dbLotteryCode}:`, err.message);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        } else {
            console.log(`[OFFICIAL KING] Result for ${targetTitle} not posted yet.`);
            return null;
        }
    } catch (e) {
        console.error(`[OFFICIAL KING] Error scraping ${targetTitle}:`, e.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { scrapeKingOfficial };
