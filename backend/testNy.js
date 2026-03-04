const scrapeAggregator = require('./scraper/universalTracker');

async function testNyNoche() {
    console.log('--- TESTING NEW YORK NOCHE SPECIFICALLY ---');
    const result = await scrapeAggregator('New York Noche', 'ny_noche');
    if (!result) {
        console.log('\n❌ No results found on the website yet. The draw might not have happened.');
    } else {
        console.log('\n✅ Results found:', result);
    }
    process.exit(0);
}

testNyNoche();
