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
    
    let target = targetTitle;
    if (targetTitle === 'Gana Más') target = 'Bancas (Tarde)';
    else if (targetTitle === 'Lotería Nacional' || targetTitle === 'nacional_noche') target = 'Bancas (Noche)';
    else if (targetTitle === 'Billetes Domingo') target = 'Billetes y Quinielas';

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

        // Logic to find the specific block for Bancas (Tarde/Noche) or Billetes
        const result = await page.evaluate((target) => {
            const tables = Array.from(document.querySelectorAll('table'));
            for (let container of tables) {
                const header = container.querySelector('h3.titulo-sorteo, h3.titulo-sorteo2');
                if (header && header.innerText.trim().includes(target)) {
                    const ballSelector = target.includes('Billetes') ? '.sorteo-bola-b-q' : '.sorteo-bola';
                    const balls = Array.from(container.querySelectorAll(ballSelector));
                    if (balls.length >= 3) {
                        return balls.map(b => b.innerText.trim()).filter(t => t.length > 0 && !isNaN(t));
                    }
                }
            }
            return null;
        }, target);

        if (result && result.length >= 3) {
            console.log(`[OFFICIAL NACIONAL] SUCCESS! ${targetTitle}:`, result);
            const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });

            return new Promise((resolve, reject) => {
                db.saveResult(lotteryCode, drawDate, drawTime, result, (err, lastID) => {
                    // BUG-004 FIX: Verificar explícitamente el éxito con el callback
                    if (err) {
                        console.error(`[OFFICIAL NACIONAL] DB save failed for ${lotteryCode}:`, err.message);
                        reject(err);
                    } else {
                        resolve({ lotteryCode, numbers: result, id: lastID });
                    }
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
