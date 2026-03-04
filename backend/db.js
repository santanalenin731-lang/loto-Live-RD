const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Path to SQLite database file
const dbPath = path.resolve(__dirname, 'loteria.db');

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeTables();
    }
});

function initializeTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS draws (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lottery_code TEXT NOT NULL,
            draw_date TEXT NOT NULL,
            draw_time TEXT,
            numbers TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(lottery_code, draw_date)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating draws table', err.message);
        } else {
            console.log('Draws table ready.');
        }
    });
}

// Function to save a new result
function saveResult(lotteryCode, drawDate, drawTime, numbers, callback) {
    const numbersJson = JSON.stringify(numbers);
    const sql = `
        INSERT INTO draws (lottery_code, draw_date, draw_time, numbers)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(lottery_code, draw_date) DO UPDATE SET
            numbers = excluded.numbers,
            draw_time = excluded.draw_time
    `;
    db.run(sql, [lotteryCode, drawDate, drawTime, numbersJson], function (err) {
        if (callback) callback(err, this.lastID);
    });
}

// Function to get the latest result for all lotteries
function getLatestResults(callback) {
    const sql = `
        SELECT lottery_code, draw_date, draw_time, numbers
        FROM draws
        WHERE id IN (
            SELECT MAX(id)
            FROM draws
            GROUP BY lottery_code
        )
        ORDER BY id DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            callback(err, null);
            return;
        }

        // Parse numbers string back to array
        const results = rows.map(row => ({
            ...row,
            numbers: JSON.parse(row.numbers)
        }));

        callback(null, results);
    });
}

module.exports = {
    db,
    saveResult,
    getLatestResults
};
