const puppeteer = require('puppeteer');
const db = require('../db');

async function scrapeLoteka() {
    console.log('[LOTEKA] Starting scraper...');
    let browser = null;
    let results = [];

    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });
        await page.goto('https://loteka.com.do/', { waitUntil: 'domcontentloaded', timeout: 45000 });
        await new Promise(r => setTimeout(r, 4000));

        const dateObjStrict = new Date();
        const expectedDateLoteka = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(dateObjStrict);

        results = await page.evaluate((expected) => {
            const txt = document.body.innerText;
            if (!txt.includes(expected)) return [];

            const blocks = document.querySelectorAll('.bloque-loteria');
            const info = [];
            for (let block of blocks) {
                const nameNode = block.querySelector('.name-sorteo img');
                let name = 'UNKNOWN';
                
                if(nameNode) {
                  name = nameNode.src.toLowerCase();
                  if(name.includes('chanceexpress')) name = "Chance Express";
                  if(name.includes('loteka_rep')) name = "Mega Chances Repartidera";
                  if(name.includes('repartidera')) name = "Mega Chances Repartidera";
                  if(name.includes('lottoloteka')) name = "Lotto Loteka";
                  if(name.includes('megachance')) name = "Mega Chances";
                  if(name.includes('megalotto')) name = "MegaLotto";
                  if(name.includes('toca3')) name = "Toca 3";
                  if(name.includes('quiniela')) name = "Quiniela Loteka";
                }

                if (name === 'UNKNOWN') {
                   const txtNode = block.querySelector('.name-sorteo, h1, h2, h3, h4, .title');
                   if (txtNode) name = txtNode.innerText.trim();
                }

                const numbersNodes = block.querySelectorAll('.bola, .numero');
                
                const finalNumbers = Array.from(numbersNodes).map(n => {
                    const match = n.innerText.match(/(\d+)/g);
                    return match ? match[match.length - 1].padStart(2, '0') : null;
                }).filter(n => n!== null);

                if (finalNumbers.length > 0) {
                     let lotteryCode = '';
                     if (name === 'Quiniela Loteka') lotteryCode = 'loteka';
                     else if (name === 'Mega Chances') lotteryCode = 'loteka_mega_chances';
                     else if (name === 'Mega Chances Repartidera') lotteryCode = 'loteka_mega_chances_repartidera';
                     else if (name === 'MegaLotto' || name === 'Lotto Loteka') lotteryCode = 'loteka_mega_lotto';
                     else if (name === 'Toca 3') lotteryCode = 'loteka_toca_3';

                     if (lotteryCode) {
                         info.push({
                             lotteryCode: lotteryCode,
                             numbers: finalNumbers,
                             name: name
                         });
                     }
                }
            }
            return info;
        });

    } catch (err) {
        console.error('[LOTEKA] Scraping error:', err.message);
    } finally {
        if (browser) {
            const pages = await browser.pages();
            await Promise.all(pages.map(p => p.close()));
            await browser.close();
        }
    }

    if (results && results.length > 0) {
        console.log(`[LOTEKA] Successfully scraped ${results.length} games.`);

        const dateObj = new Date();
        const drawDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(dateObj);
        const drawTime = dateObj.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });

        // Expected ball counts per Loteka game
        const expectedLengths = {
            'loteka': 3,
            'loteka_mega_chances': 5,
            'loteka_mega_chances_repartidera': 1,
            'loteka_mega_lotto': 8,
            'loteka_toca_3': 3
        };

        for (const result of results) {
            const expected = expectedLengths[result.lotteryCode] || 3;
            if (result.numbers.length < expected) {
                console.log(`[LOTEKA] Partial result for ${result.name}: expected ${expected}, got ${result.numbers.length}. Skipping.`);
                continue;
            }
            result.numbers = result.numbers.slice(0, expected);

            // Modify DB save to use Promises to ensure completion before returning
            await new Promise((resolve) => {
                db.saveResult(result.lotteryCode, drawDate, drawTime, result.numbers, (err) => {
                    if (err && !err.message.includes('SQLITE_CONSTRAINT')) {
                        console.error(`[LOTEKA] DB Save Error for ${result.name}:`, err.message);
                    } else if (err && err.message.includes('SQLITE_CONSTRAINT')) {
                         console.log(`[LOTEKA] Notice: Results for ${result.name} already exist in DB for today.`);
                    } else {
                        console.log(`[LOTEKA] Result saved to DB for ${result.name} (${drawDate})`);
                    }
                    resolve();
                });
            });
        }
    } else {
        console.log('[LOTEKA] Could not find results on page.');
    }

    // Return the full array of results so cronManager can broadcast all of them
    return results && results.length > 0 ? results : null;
}

if (require.main === module) {
    scrapeLoteka().then(() => {
        setTimeout(() => process.exit(0), 2000);
    });
}

module.exports = scrapeLoteka;
