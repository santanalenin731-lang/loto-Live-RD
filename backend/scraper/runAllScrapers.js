const scrapeAggregator = require('./universalTracker');
const scrapeLoteka = require('./lotekaTracker');
const scrapeRealConectate = require('./realTracker');

(async () => {
   try {
     console.log("Running scraper tests manually...");
     await scrapeAggregator('toca3', 'Toca 3', 'loteka_toca_3');
     await scrapeLoteka();
   } catch (e) {
     console.error(e);
   } finally {
     process.exit(0);
   }
})();
