const puppeteer = require('puppeteer');

async function testAggregator() {
    console.log('[AGGREGATOR] Connecting to loteriasdominicanas.com...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    await page.goto('https://loteriasdominicanas.com/', { waitUntil: 'networkidle2', timeout: 60000 });

    // Evaluate to get titles and numbers
    const lotteries = await page.evaluate(() => {
        const results = [];
        const blocks = document.querySelectorAll('.game-block');
        blocks.forEach(b => {
            const title = b.querySelector('.game-title')?.innerText.trim() || 'Unknown';
            const numbers = Array.from(b.querySelectorAll('.score')).map(n => n.innerText.trim());
            results.push({ title, numbers });
        });
        return results;
    });

    console.log("Scraped Lotteries:\n", JSON.stringify(lotteries, null, 2));

    const firstBlockHTML = await page.evaluate(() => {
        const block = document.querySelector('.game-block');
        return block ? block.innerHTML : 'No .game-block found';
    });
    console.log("\nFirst Block HTML:\n", firstBlockHTML.substring(0, 1000));

    await browser.close();
}

testAggregator();
