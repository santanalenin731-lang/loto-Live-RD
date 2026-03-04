const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    try {
        await page.goto('https://loteka.com.do/', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 4000));

        const details = await page.evaluate(() => {
            const blocks = document.querySelectorAll('.bloque-loteria');
            const info = [];
            for (let block of blocks) {
                const nameNode = block.querySelector('.name-sorteo, h1, h2, h3, h4, .title');
                const name = nameNode ? nameNode.innerText.trim() : 'UNKNOWN';

                const numbersNodes = block.querySelectorAll('.bola, .numero');
                const numbers = Array.from(numbersNodes).map(n => n.innerText.trim());

                info.push({ name, numbers });
            }
            return info;
        });

        console.log(JSON.stringify(details, null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await browser.close();
    }
})();
