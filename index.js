// index.js — KV Dashboard Server (clean baseline)
const express = require("express");
const cors = require("cors");
const app = express();

// ---- CORS (allow your Vercel client) ----
const ALLOWED_ORIGINS = [
  "https://kv-dashboard-client.vercel.app"
];
app.use(cors({
  origin(origin, cb) {
    // Allow server-to-server/Render health checks (no origin)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());

// ---- Health (Render pings this) ----
app.get("/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// ---- Mock data (temporary until real DB) ----
const vehicles = [
  { id: "veh_1", name: "Toyota RAV4", plate: "ABC-123", currentOdometer: 41250, status: "available" },
  { id: "veh_2", name: "BMW 3 Series", plate: "BMW-333", currentOdometer: 65320, status: "out" },
  { id: "veh_3", name: "Ford Fiesta",  plate: "FOR-555", currentOdometer: 28870, status: "available" }
];

const customers = [
  { id: "cust_1", name: "John Doe",  phone: "401-555-1234", email: "john@example.com" },
  { id: "cust_2", name: "Jane Smith", phone: "401-555-5678", email: "jane@example.com" }
];

// ---- API endpoints used by the dashboard ----
app.get("/vehicles", (req, res) => {
  res.json(vehicles);
});

app.get("/customers", (req, res) => {
  res.json(customers);
});

app.get("/stats/summary", (req, res) => {
  const activeRentals = vehicles.filter(v => v.status === "out").length;
  res.json({
    bookingsTotal: 128,            // placeholder
    activeRentals,
    vehicles: vehicles.length,
    revenue: 12480                  // placeholder
  });
});

// ---- Root helper so hitting base URL doesn’t 404 ----
app.get("/", (req, res) => {
  res.send("KV Dashboard API is running. Try /health, /vehicles, /customers, or /stats/summary");
});

// ---- Start server (Render sets PORT) ----
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`KV API listening on ${PORT}`));
