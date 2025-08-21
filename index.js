// index.js — KV Dashboard API (Render-ready)
const express = require("express");
const cors = require("cors");

const app = express();

// --- CORS: allow your Vercel client + local dev ---
const ALLOWED_ORIGINS = [
  "https://kv-dashboard-client.vercel.app",
  "http://localhost:5173"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Vary", "Origin");
  next();
});

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);             // allow curl/postman
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

app.use(express.json());

// --- Health check (Render pings this) ---
app.get("/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// --- Simple API for your dashboard cards ---
app.get("/stats/summary", (req, res) => {
  res.json({
    bookingsTotal: 128,
    activeRentals: 14,
    vehicles: 23,
    revenue: 12480
  });
});

// Root message so hitting the base URL doesn't 404
app.get("/", (req, res) => {
  res.send("KV Dashboard API is running. Try /health or /stats/summary");
});

// --- Start server (Render provides PORT) ---
const PORT = process.env.PORT || 10000;
// ---- TEMP in-memory data (replace with DB later) ----
let vehicles = [
  { id: "veh_1", name: "Toyota RAV4", plate: "ABC-123", currentOdometer: 41250, status: "available" },
  { id: "veh_2", name: "BMW 3 Series", plate: "BMW-333", currentOdometer: 65320, status: "out" },
  { id: "veh_3", name: "Ford Fiesta", plate: "FOR-555", currentOdometer: 28870, status: "available" },
];

// list vehicles (for the Vehicles tab)
app.get("/vehicles", (req, res) => {
  res.json(vehicles);
});

// simple stats tile data (optional; safe to include)
app.get("/stats/summary", (req, res) => {
  const activeRentals = vehicles.filter(v => v.status === "out").length;
  res.json({
    vehicles: vehicles.length,
    activeRentals,
    revenue: 17449, // placeholder for now
  });
});

app.listen(PORT, () => console.log(`KV API listening on ${PORT}`));

