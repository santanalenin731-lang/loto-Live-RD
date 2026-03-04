const puppeteer = require('puppeteer');

async function testNacional() {
    console.log('[NACIONAL] Connecting to Lotería Nacional...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    await page.goto('https://loterianacional.gob.do/resultados/', { waitUntil: 'networkidle2', timeout: 60000 });

    const html = await page.content();
    console.log('[NACIONAL] Page loaded. Length:', html.length);

    // We will dump the text of the body to see what structure we are working with
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
    console.log(bodyText);

    await browser.close();
}

testNacional();
