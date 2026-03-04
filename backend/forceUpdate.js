const scrapeAggregator = require('./scraper/universalTracker');
const scrapeLoteka = require('./scraper/lotekaTracker');

async function forceUpdate() {
    console.log('--- FORZANDO ACTUALIZACIÓN MISSED CRONS ---');
    console.log('1. Lotería Nacional (Noche)');
    await scrapeAggregator('Lotería Nacional', 'nacional_noche');

    console.log('\n2. Primera Noche');
    await scrapeAggregator('Primera Noche', 'primera_noche');

    console.log('\n3. Florida Noche');
    await scrapeAggregator('Florida Noche', 'fl_noche');

    console.log('\n4. Loteka');
    await scrapeLoteka();

    console.log('--- DONE! Refresca tu página ---');
    process.exit(0);
}

forceUpdate();
