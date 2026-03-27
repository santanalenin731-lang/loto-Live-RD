const db = require('./db');

const billetes = [
    {
        code: 'nacional_billetes_domingo',
        date: '2026-03-22',
        time: '6:00 PM',
        numbers: ['586605', '011557', '131433']
    },
    {
        code: 'nacional_billetes_jueves',
        date: '2026-03-26',
        time: '9:00 PM',
        numbers: ['025933', '813469', '288182']
    }
];

function seed() {
    console.log('🌱 Seeding Billetes results...');
    let pending = billetes.length;
    
    billetes.forEach(b => {
        db.saveResult(b.code, b.date, b.time, b.numbers, (err) => {
            if (err) console.error(`Error seeding ${b.code}:`, err.message);
            else console.log(`✅ Seeded ${b.code} for ${b.date}`);
            
            pending--;
            if (pending === 0) {
                console.log('✨ Seeding complete. Closing DB...');
                db.db.close();
            }
        });
    });
}

seed();
