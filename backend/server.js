const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const db = require('./db');
const { initializeCrons, backfillAll } = require('./cronManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve the frontend static files
app.use(express.static(path.join(__dirname, '../')));

// API Endpoint to get current results
app.get('/api/results/latest', (req, res) => {
    db.getLatestResults((err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error fetching results' });
        }
        res.json(results);
    });
});

// WebSocket connection for real-time updates
io.on('connection', (socket) => {
    console.log('A user connected via WebSocket', socket.id);

    // Optionally format and emit the current state on initial connection
    db.getLatestResults((err, results) => {
        if (!err && results.length > 0) {
            socket.emit('initial_data', results);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    });
});

// Function to trigger real-time updates to all connected clients
function broadcastNewResult(lotteryCode, numbers, drawTime) {
    io.emit('new_result', {
        lottery_code: lotteryCode,
        numbers: numbers,
        draw_time: drawTime,
        timestamp: new Date().toISOString()
    });
}

// Export for use in scrapers/cron
module.exports = { broadcastNewResult };

// Start the server
server.listen(PORT, () => {
    console.log(`🚀 Lottery Server running on http://localhost:${PORT}`);

    // Start Cron Jobs
    initializeCrons(broadcastNewResult);

    // Automatically perform an initial backfill without blocking the listener
    // Note: Do not await here so the server immediately serves requests while fetching
    backfillAll(broadcastNewResult);
});
