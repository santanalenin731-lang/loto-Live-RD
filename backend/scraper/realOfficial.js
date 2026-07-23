const puppeteer = require('puppeteer');
const db = require('../db');

/**
 * OFFICIAL SCRAPER: Loto Real
 * Source: https://www.lotoreal.com.do/
 * Direct access to the Quasar-driven dashboard.
 */
async function scrapeRealOfficial(targetGame, lotteryCode) {
    const url = 'https://www.lotoreal.com.do/';
    console.log(`[OFFICIAL REAL] Attacking ${targetGame} at ${url}...`);

    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36');

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });

        // Wait for Vue container and hydration
        try {
            await page.waitForSelector('.result__container', { timeout: 10000 });
        } catch (e) {}
        await new Promise(res => setTimeout(res, 5000));

        const now = new Date();
        const drawDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
        const expectedDateStr = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now).replace(/\//g, '-'); // e.g. "22-07-2026"

        // Real uses styled balls labeled with specific game codes inside .result__container
        const result = await page.evaluate((target, expectedDate) => {
            const altKeywords = {
                'Quiniela Real': 'loteria real',
                'Tu Fecha Real': 'tu fecha real',
                'Pega 4 Real': 'pega 4 real',
                'Nueva Yol Real': 'nueva yol real',
                'Loto Pool': 'loto pool',
                'Loto Real': 'loto real',
                'Super Palé': 'pale real'
            };
            const keyword = altKeywords[target] || target;
            
            // Buscar la imagen con el alt correspondiente
            const images = Array.from(document.querySelectorAll('img'));
            // También buscamos en aria-label de elementos cercanos por si no es img sino div rol="img"
            let img = images.find(i => i.alt && i.alt.toLowerCase().includes(keyword.toLowerCase()));
            
            let container = null;
            if (img) {
                container = img.parentElement;
                while (container && container !== document.body) {
                    if (container.classList.contains('result__container')) {
                        break;
                    }
                    container = container.parentElement;
                }
            } else {
                // Si no hay img con alt, buscar divs con aria-label que coincida
                const divs = Array.from(document.querySelectorAll('[aria-label]'));
                const div = divs.find(d => d.getAttribute('aria-label').toLowerCase().includes(keyword.toLowerCase()));
                if (div) {
                    container = div.parentElement;
                    while (container && container !== document.body) {
                        if (container.classList.contains('result__container')) {
                            break;
                        }
                        container = container.parentElement;
                    }
                }
            }
            
            if (!container && img) {
                container = img.closest('.result__container, div[class*="container"]');
            }
            
            if (container) {
                // Validate date inside container (e.g. "22 - 07 - 2026")
                const dateEl = container.querySelector('.result__date');
                if (dateEl) {
                    const dateText = dateEl.innerText.trim().replace(/\s+/g, ''); // Remove spaces
                    if (dateText && !dateText.includes(expectedDate)) {
                        return null; // Old results, retry later
                    }
                }

                const balls = Array.from(container.querySelectorAll('.bolo, .score'));
                if (balls.length > 0) {
                    return balls.map(b => b.innerText.trim()).filter(t => t.length > 0 && !isNaN(t));
                }
            }
            return null;
        }, targetGame, expectedDateStr);

        if (result && result.length > 0) {
            console.log(`[OFFICIAL REAL] SUCCESS! ${targetGame}:`, result);
            const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });

            return new Promise((resolve, reject) => {
                db.saveResult(lotteryCode, drawDate, drawTime, result, (err) => {
                    if (err && !err.message.includes('SQLITE_CONSTRAINT')) reject(err);
                    else resolve({ lotteryCode, numbers: result });
                });
            });
        } else {
            console.log(`[OFFICIAL REAL] Result for ${targetGame} not posted or date mismatch yet on the official site.`);
            
            // Try fallback to loteriasdominicanas.com (unless it's Tu Fecha Real or Pega 4 Real which might not be on the homepage)
            if (targetGame !== 'Tu Fecha Real' && targetGame !== 'Pega 4 Real') {
                try {
                    console.log(`[OFFICIAL REAL] Trying fallback to loteriasdominicanas.com for ${targetGame}...`);
                    const { scrapeAmericanasOfficial } = require('./americanasOfficial');
                    let fallbackTarget = targetGame;
                    if (targetGame === 'Nueva Yol Real') fallbackTarget = 'New York Tarde';
                    else if (targetGame === 'Super Palé') fallbackTarget = 'Super Palé';
                    
                    const fallbackResult = await scrapeAmericanasOfficial(fallbackTarget, lotteryCode);
                    if (fallbackResult) {
                        console.log(`[OFFICIAL REAL] Fallback SUCCESS for ${targetGame}:`, fallbackResult);
                        return { lotteryCode, numbers: fallbackResult };
                    }
                } catch (err) {
                    console.error(`[OFFICIAL REAL] Fallback failed for ${targetGame}:`, err.message);
                }
            }
            return null;
        }

    } catch (error) {
        console.error(`[OFFICIAL REAL] Error:`, error.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = scrapeRealOfficial;
