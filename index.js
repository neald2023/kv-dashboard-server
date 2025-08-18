const express = require("express");
const cors = require("cors");

const app = express();

// === allow your Vercel site to call this API ===
const allowedOrigins = [
  "https://kv-dashboard-client.vercel.app", // your live client URL
  "http://localhost:5173"                    // dev (optional)
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

// health check
app.get("/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// summary (mock data the dashboard needs)
app.get("/stats/summary", (req, res) => {
  res.json({
    bookingsTotal: 128,
    activeRentals: 14,
    vehicles: 23,
    revenue: 12480
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("KV server listening on", PORT));
