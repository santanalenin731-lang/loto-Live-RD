const { backfillAll } = require('./cronManager');

async function run() {
    console.log('--- STARTING STANDALONE MANUAL BACKFILL ---');
    try {
        await backfillAll();
        console.log('--- STANDALONE MANUAL BACKFILL COMPLETE ---');
        process.exit(0);
    } catch (e) {
        console.error('Standalone Backfill failed:', e.message);
        process.exit(1);
    }
}

run();
