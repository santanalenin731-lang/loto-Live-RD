const puppeteer = require('puppeteer');
const db = require('../db');

/**
 * OFFICIAL SCRAPER: Lotería Nacional Dominicana
 * Source: https://loterianacional.gob.do
 * This is the primary government source.
 */
async function scrapeNacionalOfficial(targetTitle, lotteryCode) {
    const isJuegaPega = targetTitle === 'Juega + Pega +';
    const url = isJuegaPega ? 'https://loteriasdominicanas.com/' : 'https://loterianacional.gob.do/';
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
        const expectedDateNacional = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); // DD/MM/YYYY
        const expectedDateAmericanas = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Santo_Domingo', month: '2-digit', day: '2-digit' }).format(now).replace(/\//g, '-'); // DD-MM

        let result = null;

        if (isJuegaPega) {
            // Scrape Juega + Pega + from LoteriasDominicanas.com with date check
            result = await page.evaluate((target, expectedDate) => {
                const cards = Array.from(document.querySelectorAll('a.flex.flex-col.gap-3.p-5'));
                for (let card of cards) {
                    const titleDiv = card.querySelector('.text-xl.font-bold div, .text-xl.font-bold');
                    if (titleDiv && titleDiv.innerText.trim().toLowerCase() === target.toLowerCase()) {
                        const cardText = card.innerText.trim();
                        // Validate date (e.g. text must contain expectedDate like "22-07")
                        if (!cardText.includes(expectedDate)) {
                            return null;
                        }
                        const ballSpans = Array.from(card.querySelectorAll('.score-shape-circle span'));
                        if (ballSpans.length >= 3) {
                            return ballSpans.map(s => s.innerText.trim()).filter(t => t.length > 0 && !isNaN(t));
                        }
                    }
                }
                return null;
            }, target, expectedDateAmericanas);
        } else {
            // Scrape standard Lotería Nacional draws with date check
            result = await page.evaluate((target, expectedDate) => {
                const tables = Array.from(document.querySelectorAll('table'));
                for (let container of tables) {
                    const header = container.querySelector('h3.titulo-sorteo, h3.titulo-sorteo2');
                    if (header && header.innerText.trim().includes(target)) {
                        // Validate date inside container table
                        const dateSpan = container.querySelector('.fecha-sorteo, .fecha-sorteo2');
                        if (dateSpan) {
                            const dateText = dateSpan.innerText.trim();
                            if (dateText && !dateText.includes(expectedDate)) {
                                return null; // Old draw date, return null to retry
                            }
                        }
                        const ballSelector = target.includes('Billetes') ? '.sorteo-bola-b-q' : '.sorteo-bola';
                        const balls = Array.from(container.querySelectorAll(ballSelector));
                        if (balls.length >= 3) {
                            return balls.map(b => b.innerText.trim()).filter(t => t.length > 0 && !isNaN(t));
                        }
                    }
                }
                return null;
            }, target, expectedDateNacional);
        }

        if (result && result.length >= 1) {
            console.log(`[OFFICIAL NACIONAL] SUCCESS! ${targetTitle}:`, result);
            const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });

            return new Promise((resolve, reject) => {
                db.saveResult(lotteryCode, drawDate, drawTime, result, (err, lastID) => {
                    if (err) {
                        console.error(`[OFFICIAL NACIONAL] DB save failed for ${lotteryCode}:`, err.message);
                        reject(err);
                    } else {
                        resolve({ lotteryCode, numbers: result, id: lastID });
                    }
                });
            });
        } else {
            console.log(`[OFFICIAL NACIONAL] Result for ${targetTitle} not posted or date mismatch on official site yet.`);
            
            // Try fallback to loteriasdominicanas.com (unless it's Billetes Domingo which is not on the homepage)
            if (targetTitle !== 'Billetes Domingo') {
                try {
                    console.log(`[OFFICIAL NACIONAL] Trying fallback to loteriasdominicanas.com for ${targetTitle}...`);
                    const { scrapeAmericanasOfficial } = require('./americanasOfficial');
                    let fallbackTarget = targetTitle;
                    if (targetTitle === 'Gana Más') fallbackTarget = 'Gana Más';
                    else if (targetTitle === 'Lotería Nacional' || targetTitle === 'nacional_noche') fallbackTarget = 'Lotería Nacional';
                    
                    const fallbackResult = await scrapeAmericanasOfficial(fallbackTarget, lotteryCode);
                    if (fallbackResult) {
                        console.log(`[OFFICIAL NACIONAL] Fallback SUCCESS for ${targetTitle}:`, fallbackResult);
                        return { lotteryCode, numbers: fallbackResult };
                    }
                } catch (err) {
                    console.error(`[OFFICIAL NACIONAL] Fallback failed for ${targetTitle}:`, err.message);
                }
            }
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
