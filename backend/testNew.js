const scrapeAggregator = require('./scraper/universalTracker');

async function testNewLotteries() {
    console.log('--- Testing New Lotteries (Sample) ---');
    console.log('1. Anguila 10:00 AM');
    await scrapeAggregator('Anguila de las 10:00', 'anguila_10');

    console.log('\n2. La Primera');
    await scrapeAggregator('La Primera', 'primera_dia');

    console.log('\n3. New York Tarde');
    await scrapeAggregator('New York Tarde', 'ny_tarde');

    console.log('--- Done ---');
    process.exit(0);
}

testNewLotteries();
