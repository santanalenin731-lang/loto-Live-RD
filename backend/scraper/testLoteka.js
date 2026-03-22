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
                // Modificado para obtener imágenes si no hay texto
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

                // Si no hay img checa text
                if (name === 'UNKNOWN') {
                   const txtNode = block.querySelector('.name-sorteo, h1, h2, h3, h4, .title');
                   if (txtNode) name = txtNode.innerText.trim();
                }

                const numbersNodes = block.querySelectorAll('.bola, .numero');
                const numbers = Array.from(numbersNodes).map(n => n.innerText.trim().replace(/\D+/g, '')); // Limpiar "1er", "2do", etc.
                
                // Hacky cleanup to only pick numbers
                const finalNumbers = Array.from(numbersNodes).map(n => {
                    const match = n.innerText.match(/(\d+)/g);
                    return match ? match[match.length - 1].padStart(2, '0') : null;
                }).filter(n => n!== null);

                info.push({ name, finalNumbers, rawNumbers: numbers });
            }
            return info;
        });

        console.log("------------------------");
        console.log(JSON.stringify(details, null, 2));
        console.log("------------------------");

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await browser.close();
    }
})();
