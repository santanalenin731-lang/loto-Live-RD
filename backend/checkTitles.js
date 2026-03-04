const puppeteer = require('puppeteer');

async function getAvailableTitles() {
    console.log('Fetching loteriasdominicanas.com to find exact game titles...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

    await page.goto('https://loteriasdominicanas.com', { waitUntil: 'networkidle2' });

    const titles = await page.evaluate(() => {
        const blocks = document.querySelectorAll('.game-block');
        return Array.from(blocks).map(b => b.querySelector('.game-title')?.innerText.trim());
    });

    console.log('AVAILABLE TITLES ON SITE:');
    titles.forEach(t => console.log(`- "${t}"`));

    await browser.close();
}

getAvailableTitles();
