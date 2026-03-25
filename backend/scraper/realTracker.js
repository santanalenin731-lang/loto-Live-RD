const puppeteer = require('puppeteer');
const db = require('../db');

/**
 * Scrapes Lotería Real directly from conectate.com.do/loterias/loto-real
 * which contains all the specialized Real games.
 */
async function scrapeRealConectate(targetTitle, lotteryCode) {
    console.log(`[REAL TRACKER] Fetching ${targetTitle} from conectate.com.do/loterias/loto-real...`);
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
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

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

        // Timeout is long because we block assets, but conectate might be slow
        await page.goto(`https://www.conectate.com.do/loterias/loto-real`, { waitUntil: 'domcontentloaded', timeout: 45000 });

        const now = new Date();
        const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Santo_Domingo', month: '2-digit', day: '2-digit' }).formatToParts(now);
        const day = parts.find(p => p.type === 'day').value;
        const month = parts.find(p => p.type === 'month').value;
        const expectedDate = `${day}-${month}`;

        // Extract numbers based on target title
        const numbers = await page.evaluate((title, expectedDate) => {
            const blocks = document.querySelectorAll('.game-block');
            for (let b of blocks) {
                // The title in conectate might just be text inside a.game-title
                const titleNode = b.querySelector('.game-title');
                if (!titleNode) continue;

                let gameTitle = titleNode.innerText.trim();

                // If it happens to be an image logo, Conectate usually provides alt text or it is sibling text. 
                // But from our prev checks .game-title exists and has text.
                if (gameTitle.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(gameTitle.toLowerCase())) {
                    
                    // VALIDATOR: Ensure the date of this block matches today
                    let dateNode = b.querySelector('.session-date');
                    if (!dateNode) dateNode = document.querySelector('.session-date');
                    
                    if (dateNode) {
                        const dateText = dateNode.innerText.trim();
                        // If it doesn't contain current DD-MM, it's outdated data!
                        if (dateText && !dateText.includes(expectedDate)) {
                            return null; // Reject extraction, causing runWithRetries to fetch again later
                        }
                    }

                    // It's a match! Collect numbers inside this block
                    const numNodes = Array.from(b.querySelectorAll('.score, .ball.real'));
                    if (numNodes.length === 0) {
                        // Sometimes conectate uses just numbers inside spans without standard classes
                        // But typically they use .score
                        const altScoreNodes = Array.from(b.querySelectorAll('.score'));
                        if (altScoreNodes.length > 0) return altScoreNodes.map(n => n.innerText.trim());

                        // What if they use a table?
                        const tableNodes = Array.from(b.querySelectorAll('td.point, td.premio, td .ball'));
                        if (tableNodes.length > 0) return tableNodes.map(n => n.innerText.trim());
                    } else {
                        return numNodes.map(n => n.innerText.trim());
                    }
                }
            }
            return null;
        }, targetTitle, expectedDate);

        if (numbers && numbers.length > 0) {
            // Validate and clean up extracted numbers
            let finalNumbers = numbers;
            let expectedLength = 3; // Default
            if (targetTitle === 'Pega 4 Real') expectedLength = 4;
            else if (targetTitle === 'Loto Pool') expectedLength = 5;
            else if (targetTitle === 'Tu Fecha Real') expectedLength = 1;
            else if (targetTitle === 'Quiniela Real') expectedLength = 3;
            else if (targetTitle === 'Loto Real' || targetTitle === 'Loto') expectedLength = 6;
            else if (targetTitle === 'Super Palé') expectedLength = 2;
            else if (targetTitle === 'Nueva Yol Real') expectedLength = 4;

            if (finalNumbers.length >= expectedLength) {
                finalNumbers = finalNumbers.slice(0, expectedLength);
                console.log(`[REAL TRACKER] Success! Extracted numbers for ${targetTitle}:`, finalNumbers);
            } else {
                console.log(`[REAL TRACKER] Partial result detected for ${targetTitle} (Expected ${expectedLength}, got ${finalNumbers.length}). Rejecting so cron retries.`);
                return null;
            }

            const drawDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
            const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });

            return new Promise((resolve, reject) => {
                db.saveResult(lotteryCode, drawDate, drawTime, finalNumbers, (err) => {
                    if (err && !err.message.includes('SQLITE_CONSTRAINT')) {
                        console.error(`[REAL TRACKER] DB Error for ${lotteryCode}:`, err.message);
                        reject(err);
                    } else {
                        if (err && err.message.includes('SQLITE_CONSTRAINT')) {
                            console.log(`[REAL TRACKER] Notice: Results for ${targetTitle} already exist in DB for today.`);
                        } else {
                            console.log(`[REAL TRACKER] Database write success for ${targetTitle} (${lotteryCode}).`);
                        }
                        resolve({ lotteryCode, numbers: finalNumbers });
                    }
                });
            });
        } else {
            console.log(`[REAL TRACKER] Warning: Could not locate visual results block for ${targetTitle} today yet.`);
            return null;
        }
    } catch (error) {
        console.error(`[REAL TRACKER] HTTP/Puppeteer Scrape Error for ${targetTitle}:`, error.message);
        return null;
    } finally {
        if (browser) {
            const pages = await browser.pages();
            await Promise.all(pages.map(p => p.close())); // Close explicit for RAM
            await browser.close();
        }
    }
}

module.exports = scrapeRealConectate;
