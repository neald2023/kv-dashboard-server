// index.js (server)
const express = require('express');
const cors = require('cors');

const app = express();

// Allow your Vercel site to call this API
const allowed = [
  'https://kv-dashboard-client.vercel.app', // your live client URL
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Quick checks
app.get('/', (req, res) => res.send('KV Server OK'));
app.get('/health', (req, res) => res.json({ ok: true }));

// Mock data for dashboard tiles
app.get('/stats/summary', (req, res) => {
  res.json({
    bookingsTotal: 128,
    activeRentals: 14,
    vehicles: 23,
    revenue: 12480,
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('KV server listening on', PORT));
