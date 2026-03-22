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

// Get hot numbers (most frequent) in the last N days
function getHotNumbers(days, limit, callback) {
    const sql = `
        WITH number_positions AS (
            SELECT 
                je.value AS number,
                je.key AS position,
                d.lottery_code,
                d.draw_date
            FROM draws d, json_each(d.numbers) je
            WHERE d.draw_date >= date('now', '-' || ? || ' days')
            AND length(je.value) <= 2
            AND je.value GLOB '[0-9]*'
        )
        SELECT 
            number,
            COUNT(*) AS total_count,
            SUM(CASE WHEN position = 0 THEN 1 ELSE 0 END) AS first_count,
            SUM(CASE WHEN position = 1 THEN 1 ELSE 0 END) AS second_count,
            SUM(CASE WHEN position = 2 THEN 1 ELSE 0 END) AS third_count,
            MAX(draw_date) AS last_seen
        FROM number_positions
        GROUP BY number
        ORDER BY total_count DESC, first_count DESC
        LIMIT ?
    `;
    db.all(sql, [days, limit || 20], (err, rows) => {
        callback(err, rows || []);
    });
}

// Get cold numbers (least frequent) in the last N days
function getColdNumbers(days, limit, callback) {
    const sql = `
        WITH number_positions AS (
            SELECT 
                je.value AS number,
                je.key AS position,
                d.lottery_code,
                d.draw_date
            FROM draws d, json_each(d.numbers) je
            WHERE d.draw_date >= date('now', '-' || ? || ' days')
            AND length(je.value) <= 2
            AND je.value GLOB '[0-9]*'
        )
        SELECT 
            number,
            COUNT(*) AS total_count,
            SUM(CASE WHEN position = 0 THEN 1 ELSE 0 END) AS first_count,
            SUM(CASE WHEN position = 1 THEN 1 ELSE 0 END) AS second_count,
            SUM(CASE WHEN position = 2 THEN 1 ELSE 0 END) AS third_count,
            MAX(draw_date) AS last_seen
        FROM number_positions
        GROUP BY number
        ORDER BY total_count ASC, last_seen ASC
        LIMIT ?
    `;
    db.all(sql, [days, limit || 20], (err, rows) => {
        callback(err, rows || []);
    });
}

// Get the full history of a specific number
function getNumberHistory(number, days, callback) {
    const paddedNum = number.toString().padStart(2, '0');
    const sql = `
        SELECT 
            d.lottery_code,
            d.draw_date,
            d.draw_time,
            je.key AS position,
            je.value AS number
        FROM draws d, json_each(d.numbers) je
        WHERE je.value = ?
        AND d.draw_date >= date('now', '-' || ? || ' days')
        ORDER BY d.draw_date DESC, d.lottery_code
    `;
    db.all(sql, [paddedNum, days], (err, rows) => {
        callback(err, rows || []);
    });
}

// Get results by specific date
function getResultsByDate(date, callback) {
    const sql = `
        SELECT lottery_code, draw_date, draw_time, numbers
        FROM draws
        WHERE draw_date = ?
        ORDER BY lottery_code
    `;
    db.all(sql, [date], (err, rows) => {
        if (err) return callback(err, null);
        const results = rows.map(row => ({
            ...row,
            numbers: JSON.parse(row.numbers)
        }));
        callback(null, results);
    });
}

// Get predictions: combines hot (trending) + cold (overdue) numbers
// Returns array: { number, score, reason, hot_count, cold_days }
function getPredictions(callback) {
    // Strategy: Hot numbers from last 3 days + numbers overdue for 5+ days from last 30 days pool
    const hotSql = `
        WITH number_positions AS (
            SELECT je.value AS number, COUNT(*) AS cnt, MAX(d.draw_date) AS last_seen
            FROM draws d, json_each(d.numbers) je
            WHERE d.draw_date >= date('now', '-7 days')
            AND length(je.value) <= 2 AND je.value GLOB '[0-9]*'
            GROUP BY je.value
        )
        SELECT number, cnt AS hot_count, last_seen
        FROM number_positions
        ORDER BY cnt DESC
        LIMIT 20
    `;

    const coldSql = `
        WITH all_numbers AS (
            SELECT je.value AS number, MAX(d.draw_date) AS last_seen
            FROM draws d, json_each(d.numbers) je
            WHERE d.draw_date >= date('now', '-30 days')
            AND length(je.value) <= 2 AND je.value GLOB '[0-9]*'
            GROUP BY je.value
        )
        SELECT number, last_seen,
               CAST(julianday('now') - julianday(last_seen) AS INTEGER) AS days_absent
        FROM all_numbers
        ORDER BY days_absent DESC
        LIMIT 20
    `;

    db.all(hotSql, [], (err, hotRows) => {
        if (err) return callback(err, []);
        db.all(coldSql, [], (err2, coldRows) => {
            if (err2) return callback(err2, []);

            // Build a merged scored list
            const scoreMap = {};

            hotRows.forEach((row, i) => {
                const n = row.number.toString().padStart(2, '0');
                scoreMap[n] = scoreMap[n] || { number: n, score: 0, hot_count: 0, days_absent: 0, reasons: [] };
                // Hot: rank bonus
                scoreMap[n].hot_count = row.hot_count;
                scoreMap[n].score += Math.max(0, 20 - i) * 2; // top hot = 40pts
                scoreMap[n].reasons.push('🔥 Tendencia');
            });

            coldRows.forEach((row, i) => {
                const n = row.number.toString().padStart(2, '0');
                scoreMap[n] = scoreMap[n] || { number: n, score: 0, hot_count: 0, days_absent: 0, reasons: [] };
                scoreMap[n].days_absent = row.days_absent || 0;
                if (row.days_absent >= 3) {
                    scoreMap[n].score += Math.min(row.days_absent * 5, 40); // max 40pts for cold
                    scoreMap[n].reasons.push(`❄️ ${row.days_absent}d sin salir`);
                }
            });

            // Sort by score desc and return top 20
            const predictions = Object.values(scoreMap)
                .filter(p => p.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 20)
                .map(p => ({ ...p, reason: [...new Set(p.reasons)].join(' · ') }));

            callback(null, predictions);
        });
    });
}

module.exports = {
    db,
    saveResult,
    getLatestResults,
    getHotNumbers,
    getColdNumbers,
    getNumberHistory,
    getResultsByDate,
    getPredictions
};

