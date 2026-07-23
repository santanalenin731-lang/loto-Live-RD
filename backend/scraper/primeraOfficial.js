const puppeteer = require('puppeteer');
const db = require('../db');

/**
 * Scrapes La Primera from its official portal https://laprimera.do/
 * @param {string} targetTitle - Name of the draw (e.g., 'Quiniela La Primera', 'La Primera Noche', 'El Quinielón Día', 'El Quinielón Noche')
 * @param {string} dbLotteryCode - DB code to save the result
 * @returns {Promise<Array<string>|null>}
 */
async function scrapePrimeraOfficial(targetTitle, dbLotteryCode) {
    const url = 'https://laprimera.do/';
    console.log(`[OFFICIAL PRIMERA] Attacking ${targetTitle} at ${url}...`);
    
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36');
        
        // Speed optimization: Block unnecessary resources
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
            else req.continue();
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait 2 seconds for JS execution just in case
        await new Promise(res => setTimeout(res, 2000));

        const now = new Date();
        const drawDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

        const monthsES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const formattedDateParts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(now);
        const day = parseInt(formattedDateParts.find(p => p.type === 'day').value);
        const monthIndex = parseInt(formattedDateParts.find(p => p.type === 'month').value) - 1;
        const year = formattedDateParts.find(p => p.type === 'year').value;
        const expectedDateStr = `${day} ${monthsES[monthIndex]} ${year}`; // e.g. "22 Julio 2026"

        const result = await page.evaluate((target, expectedDate) => {
            const logoMap = {
                'La Primera Día': 'logo-laprimera-dia',
                'Quiniela La Primera': 'logo-laprimera-dia',
                'La Primera Noche': 'logo-laprimera-noche',
                'El Quinielón Día': 'logo-quinielon-dia',
                'El Quinielón Noche': 'logo-quinielon-noche',
                'Loto 5': 'logo-loteria-37'
            };
            const logoKeyword = logoMap[target] || target;
            
            const wrappers = Array.from(document.querySelectorAll('.wrapper'));
            for (let wrapper of wrappers) {
                const imgDiv = wrapper.querySelector('.wrap-img .img');
                if (imgDiv) {
                    const bgStyle = imgDiv.style.backgroundImage || '';
                    if (bgStyle.toLowerCase().includes(logoKeyword.toLowerCase())) {
                        // Validate date inside wrapper
                        const dateEl = wrapper.querySelector('time.date');
                        if (dateEl) {
                            const dateText = dateEl.innerText.trim();
                            if (dateText && !dateText.toLowerCase().includes(expectedDate.toLowerCase())) {
                                return null; // Old results, return null to retry
                            }
                        }
                        const amountDivs = Array.from(wrapper.querySelectorAll('.wrap-results .amount'));
                        if (amountDivs.length > 0) {
                            return amountDivs.map(d => d.innerText.trim()).filter(t => t.length > 0 && !isNaN(t));
                        }
                    }
                }
            }
            return null;
        }, targetTitle, expectedDateStr);

        if (result && result.length >= 1) {
            console.log(`[OFFICIAL PRIMERA] SUCCESS! ${targetTitle}:`, result);
            
            const drawTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Santo_Domingo', hour12: true, hour: '2-digit', minute: '2-digit' });
            
            return new Promise((resolve, reject) => {
                db.saveResult(dbLotteryCode, drawDate, drawTime, result, (err, lastID) => {
                    if (err) {
                        console.error(`[OFFICIAL PRIMERA] DB save failed for ${dbLotteryCode}:`, err.message);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        } else {
            console.log(`[OFFICIAL PRIMERA] Result for ${targetTitle} not posted or date mismatch yet.`);
            return null;
        }
    } catch (e) {
        console.error(`[OFFICIAL PRIMERA] Error scraping ${targetTitle}:`, e.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { scrapePrimeraOfficial };
