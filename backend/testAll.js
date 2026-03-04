const scrapeAggregator = require('./scraper/universalTracker');

async function run() {
    console.log('--- Testing Aggregator Scrapers ---');
    await scrapeAggregator('Gana Más', 'nacional');
    await scrapeAggregator('Lotería Nacional', 'nacional'); // Often drawn at night
    await scrapeAggregator('Quiniela Leidsa', 'leidsa');
    await scrapeAggregator('Quiniela Real', 'real');
    console.log('--- Done ---');
    process.exit(0);
}
run();
