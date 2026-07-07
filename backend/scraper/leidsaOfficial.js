const puppeteer = require('puppeteer');
const db = require('../db');

/**
 * OFFICIAL SCRAPER: LEIDSA (La Fabrica de Millonarios)
 * Source: https://leidsa.com
 * This goes directly to the results dashboard of the official Leidsa portal.
 */
async function scrapeLeidsaOfficial(targetGame, lotteryCode) {
    const url = 'https://leidsa.com/resultados/';
    console.log(`[OFFICIAL LEIDSA] Attacking ${targetGame} at ${url}...`);

    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36');
        
        // Block assets for speed
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
            else req.continue();
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

        const now = new Date();
        const drawDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

        // LEIDSA uses next.js with custom css class structures on its home page
        const result = await page.evaluate((target) => {
            const altKeywords = {
                'Quiniela Leidsa': 'Quiniela Pale',
                'Pega 3 Más': 'Pega3Mas',
                'Loto Pool': 'Loto Pool',
                'Super Kino TV': 'KinoTV',
                'Loto - Super Loto Más': 'leidsa-loto',
                'Super Palé': 'Super Pale'
            };
            const keyword = altKeywords[target] || target;
            
            // Special Case: Super Palé is derived from Quiniela Leidsa (first 2 numbers)
            // If website doesn't show it directly, we fall back to Quiniela Leidsa's first 2 balls
            let searchKeyword = keyword;
            if (keyword === 'Super Pale') {
                searchKeyword = 'Quiniela Pale';
            }

            const images = Array.from(document.querySelectorAll('img'));
            const img = images.find(i => i.alt && i.alt.toLowerCase().includes(searchKeyword.toLowerCase()));
            if (!img) return null;
            
            let container = img.parentElement;
            while (container && container !== document.body) {
                if (container.classList.contains('css-dg8q2z') || container.classList.contains('css-1mqodg7')) {
                    break;
                }
                container = container.parentElement;
            }
            
            if (!container) {
                container = img.closest('.chakra-stack, div[class*="stack"], div[class*="container"]');
            }
            
            if (container) {
                const balls = Array.from(container.querySelectorAll('.css-yogco6'));
                if (balls.length > 0) {
                    const rawNums = balls.map(b => b.innerText.trim()).filter(t => t.length > 0 && !isNaN(t));
                    if (keyword === 'Super Pale' && rawNums.length >= 2) {
                        return rawNums.slice(0, 2);
                    }
                    return rawNums;
                }
            }
            return null;
        }, targetGame);

        if (result && result.length > 0) {
            console.log(`[OFFICIAL LEIDSA] SUCCESS! ${targetGame}:`, result);
            const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });

            return new Promise((resolve, reject) => {
                db.saveResult(lotteryCode, drawDate, drawTime, result, (err, lastID) => {
                    // BUG-005 FIX: Verificar explícitamente el éxito con el callback
                    if (err) {
                        console.error(`[OFFICIAL LEIDSA] DB save failed for ${lotteryCode}:`, err.message);
                        reject(err);
                    } else {
                        resolve({ lotteryCode, numbers: result, id: lastID });
                    }
                });
            });
        } else {
            console.log(`[OFFICIAL LEIDSA] Result for ${targetGame} not posted yet.`);
            return null;
        }

    } catch (error) {
        console.error(`[OFFICIAL LEIDSA] Error:`, error.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = scrapeLeidsaOfficial;
