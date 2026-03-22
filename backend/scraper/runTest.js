const scrapeAggregator = require('./universalTracker');
(async () => {
    try {
        const res = await scrapeAggregator('Toca 3', 'loteka_toca_3', '/lotericadominicanas/toca-3');
        console.log("Result:", res);
    } catch (e) {
        console.error(e);
    }
})();
