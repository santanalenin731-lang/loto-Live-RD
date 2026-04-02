const puppeteer = require('puppeteer');
const db = require('../db');

/**
 * OFFICIAL SCRAPER: Lotería Nacional Dominicana
 * Source: https://loterianacional.gob.do
 * This is the primary government source.
 */
async function scrapeNacionalOfficial(targetTitle, lotteryCode) {
    const url = 'https://loterianacional.gob.do/';
    console.log(`[OFFICIAL NACIONAL] Attacking ${targetTitle} at ${url}...`);
    
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36');
        
        // Speed: block images
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
            else req.continue();
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        const now = new Date();
        const drawDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

        // Logic to find the specific block for Gana Mas or National Night
        const result = await page.evaluate((target) => {
            // Find all section titles or labels
            const containers = Array.from(document.querySelectorAll('div, section'));
            
            // Lotería Nacional typically labels blocks as "Gana Más" or "Bancas Noche"
            // We search for the text and then look for the closest balls
            for (let container of containers) {
                if (container.innerText && container.innerText.includes(target)) {
                    // Look for child elements with result balls. 
                    // Selectors found in investigation: .sorteo-bola span
                    const balls = Array.from(container.querySelectorAll('.sorteo-bola span, .bola, span[style*="border-radius: 50%"]'));
                    if (balls.length >= 3) {
                        return balls.map(b => b.innerText.trim()).filter(t => t.length > 0 && !isNaN(t));
                    }
                }
            }
            return null;
        }, targetTitle);

        if (result && result.length >= 3) {
            console.log(`[OFFICIAL NACIONAL] SUCCESS! ${targetTitle}:`, result);
            const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });

            return new Promise((resolve, reject) => {
                db.saveResult(lotteryCode, drawDate, drawTime, result, (err) => {
                    if (err && !err.message.includes('SQLITE_CONSTRAINT')) reject(err);
                    else resolve({ lotteryCode, numbers: result });
                });
            });
        } else {
            console.log(`[OFFICIAL NACIONAL] Result for ${targetTitle} not posted on official site yet.`);
            return null;
        }

    } catch (error) {
        console.error(`[OFFICIAL NACIONAL] Error:`, error.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = scrapeNacionalOfficial;
