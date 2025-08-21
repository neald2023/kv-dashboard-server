// index.js — KV Dashboard Server (vehicles with full profile)
const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());

// CORS: allow your Vercel client
const ALLOWED_ORIGINS = [
  "https://kv-dashboard-client.vercel.app"
];
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  }
}));

// Health
app.get("/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// ---------- MOCK DATA (now with full fields) ----------
let vehicles = [
  {
    id: "veh_1",
    year: 2021,
    make: "Toyota",
    model: "RAV4",
    vin: "2T3H1RFV1MW123456",
    color: "White",
    plate: "ABC-123",
    currentOdometer: 41250,
    status: "available"
  },
  {
    id: "veh_2",
    year: 2020,
    make: "BMW",
    model: "3 Series",
    vin: "WBA5A7C5XLF654321",
    color: "Black",
    plate: "BMW-333",
    currentOdometer: 65320,
    status: "out"
  },
  {
    id: "veh_3",
    year: 2019,
    make: "Ford",
    model: "Fiesta",
    vin: "3FADP4BJ5KM789012",
    color: "Blue",
    plate: "FOR-555",
    currentOdometer: 28870,
    status: "maintenance"
  }
];

let customers = [
  { id: "cus_1", name: "Lisa Smith",  email: "lisa@example.com",  phone: "+14085550111", license: "S123-4567" },
  { id: "cus_2", name: "Thomas Brown", email: "thomas@example.com", phone: "+14085550222", license: "B987-6543" }
];

// Reads
app.get("/vehicles", (req, res) => res.json(vehicles));
app.get("/customers", (req, res) => res.json(customers));

app.get("/stats/summary", (req, res) => {
  const activeRentals = vehicles.filter(v => v.status === "out").length;
  res.json({
    bookingsTotal: 128,
    activeRentals,
    vehicles: vehicles.length,
    revenue: 12480
  });
});

// ---------- UPDATE VEHICLE PROFILE ----------
/*
PUT /vehicles/:id
Body (any subset of these fields):
{
  "year": 2021,
  "make": "Toyota",
  "model": "RAV4",
  "vin": "....",
  "color": "White",
  "plate": "ABC-123",
  "currentOdometer": 42000,
  "status": "available" | "out" | "maintenance"
}
*/
app.put("/vehicles/:id", (req, res) => {
  const { id } = req.params;
  const v = vehicles.find(x => x.id === id);
  if (!v) return res.status(404).json({ ok: false, error: "Vehicle not found" });

  const allowedStatuses = ["available", "out", "maintenance"];
  const data = req.body || {};

  // Validate & assign only known fields
  if (data.status !== undefined && !allowedStatuses.includes(data.status)) {
    return res.status(400).json({ ok: false, error: "Invalid status" });
  }
  if (data.currentOdometer !== undefined) {
    const n = Number(data.currentOdometer);
    if (!Number.isFinite(n) || n < 0) {
      return res.status(400).json({ ok: false, error: "Invalid odometer" });
    }
    v.currentOdometer = n;
  }
  if (data.year !== undefined) v.year = Number(data.year);
  if (data.make !== undefined) v.make = String(data.make);
  if (data.model !== undefined) v.model = String(data.model);
  if (data.vin !== undefined) v.vin = String(data.vin);
  if (data.color !== undefined) v.color = String(data.color);
  if (data.plate !== undefined) v.plate = String(data.plate);
  if (data.status !== undefined) v.status = data.status;

  return res.json({ ok: true, vehicle: v });
});

// Root helper
app.get("/", (req, res) => {
  res.send("KV Dashboard API running. Try /health, /vehicles, /customers, /stats/summary");
});

// Start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`KV API listening on ${PORT}`));
