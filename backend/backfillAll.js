const scrapeAggregator = require('./scraper/universalTracker');
const scrapeLoteka = require('./scraper/lotekaTracker');

const targets = [
    { title: 'La Primera Día', code: 'primera_dia' },
    { title: 'Anguila Mañana', code: 'anguila_10' },
    { title: 'King Lottery 12:30', code: 'king_12' },
    { title: 'La Suerte 12:30', code: 'suerte_dia' },
    { title: 'Quiniela Real', code: 'real' },
    { title: 'Florida Día', code: 'fl_dia' },
    { title: 'Anguila Medio Día', code: 'anguila_1' },
    { title: 'Quiniela LoteDom', code: 'lotedom' },
    { title: 'Gana Más', code: 'nacional' },
    { title: 'New York Tarde', code: 'ny_tarde' },
    { title: 'La Suerte 18:00', code: 'suerte_tarde' },
    { title: 'Anguila Tarde', code: 'anguila_6' },
    { title: 'King Lottery 7:30', code: 'king_7' },
    // Loteka is separate
    { title: 'Primera Noche', code: 'primera_noche' },
    { title: 'Lotería Nacional', code: 'nacional_noche' },
    { title: 'Quiniela Leidsa', code: 'leidsa' },
    { title: 'Anguila Noche', code: 'anguila_9' },
    { title: 'Florida Noche', code: 'fl_noche' },
    { title: 'New York Noche', code: 'ny_noche' }
];

async function backfillAll() {
    console.log('--- FORZANDO ACTUALIZACIÓN DE TODAS LAS LOTERÍAS ---');

    for (const target of targets) {
        console.log(`\nFetching: ${target.title}...`);
        await scrapeAggregator(target.title, target.code);
    }

    console.log(`\nFetching: Loteka...`);
    await scrapeLoteka();

    console.log('\n--- DONE! Refresca tu página ---');
    process.exit(0);
}

backfillAll();
