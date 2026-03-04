const puppeteer = require('puppeteer');
const db = require('../db');

async function scrapeLoteka() {
    console.log('[LOTEKA] Starting scraper...');
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    let result = null;

    try {
        await page.goto('https://loteka.com.do/', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 4000));

        result = await page.evaluate(() => {
            const blocks = document.querySelectorAll('.bloque-loteria');
            for (let block of blocks) {
                const numbersNodes = block.querySelectorAll('.bola, .numero');
                const rawNumbers = Array.from(numbersNodes).map(n => n.innerText.trim());

                // Identify Quiniela by checking for 1er, 2do, 3er markers
                // e.g. ["1er.\n74", "2do.\n02", "3er.\n97"]
                if (rawNumbers.length === 3 && rawNumbers[0].includes('1er')) {
                    // Clean up string to just digits
                    const numbers = rawNumbers.map(n => {
                        const match = n.match(/\d+$/); // Match digits at the end
                        return match ? match[0].padStart(2, '0') : null;
                    });

                    if (numbers.every(n => n !== null)) {
                        return {
                            lotteryCode: 'loteka',
                            numbers: numbers
                        };
                    }
                }
            }
            return null;
        });

    } catch (err) {
        console.error('[LOTEKA] Scraping error:', err.message);
    } finally {
        await browser.close();
    }

    if (result) {
        console.log('[LOTEKA] Successfully scraped:', result.numbers);

        // Get today's date in YYYY-MM-DD for DR timezone (approx by using local if server is local, or standard offset)
        const dateObj = new Date();
        const drawDate = dateObj.toISOString().split('T')[0];
        const drawTime = dateObj.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });

        // Save to Database
        db.saveResult(result.lotteryCode, drawDate, drawTime, result.numbers, (err) => {
            if (err) {
                console.error('[LOTEKA] DB Save Error:', err.message);
            } else {
                console.log('[LOTEKA] Result saved to DB for', drawDate);
                // In a full implementation, we would broadcast the result to WebSockets here if the server module was passed in.
            }
        });

    } else {
        console.log('[LOTEKA] Could not find Quiniela results on page.');
    }

    return result;
}

// Run if called directly
if (require.main === module) {
    scrapeLoteka().then(() => {
        // Wait 2 sec for db save to finish before exiting process
        setTimeout(() => process.exit(0), 2000);
    });
}

module.exports = scrapeLoteka;
