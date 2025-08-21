// index.js — KV Dashboard Server (full file)
// Uses: express + cors
import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());

// ----- CORS: allow your Vercel app + localhost + all vercel.app previews -----
const ALLOWED_ORIGINS = [
  "https://kv-dashboard-client.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, cb) => {
      // allow server-to-server, curl, and same-origin (no Origin header)
      if (!origin) return cb(null, true);

      let ok = false;
      try {
        const host = new URL(origin).host; // e.g. my-build-abc.vercel.app
        const isVercelPreview = /\.vercel\.app$/i.test(host);
        ok = ALLOWED_ORIGINS.includes(origin) || isVercelPreview;
      } catch {
        ok = false;
      }
      return ok ? cb(null, true) : cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// -------------------- MOCK DATA (temporary) --------------------
const vehicles = [
  { id: "veh_1", year: 2021, make: "Toyota", model: "RAV4", vin: "JTMB1RFV1M1234567", color: "Silver", plate: "ABC-123", currentOdometer: 41250, status: "available" },
  { id: "veh_2", year: 2019, make: "BMW", model: "3 Series", vin: "WBA8E1G58GNU12345", color: "Black", plate: "BMW-333", currentOdometer: 65320, status: "out" },
  { id: "veh_3", year: 2020, make: "Ford", model: "Fiesta", vin: "3FADP4BJ0LM123456", color: "Blue", plate: "FOR-555", currentOdometer: 28870, status: "available" },
];

const customers = [
  { id: "cust_1", name: "Lisa Smith", phone: "+1 555-0101", email: "lisa@example.com", dlNumber: "S1234567" },
  { id: "cust_2", name: "Thomas Brown", phone: "+1 555-0202", email: "thomas@example.com", dlNumber: "B2345678" },
  { id: "cust_3", name: "Sarah Jones", phone: "+1 555-0303", email: "sarah@example.com", dlNumber: "J3456789" },
];

const bookings = [
  { id: "bk_1", customerId: "cust_1", vehicleId: "veh_1", pickup: "2025-08-21T10:00:00Z", dropoff: "2025-08-23T10:00:00Z", status: "scheduled", estTotal: 240.0 },
  { id: "bk_2", customerId: "cust_2", vehicleId: "veh_2", pickup: "2025-08-18T12:00:00Z", dropoff: "2025-08-20T12:00:00Z", status: "out", estTotal: 360.0 },
];

// -------------------- ROUTES --------------------

// Health (for the “Live/Offline” badge)
app.get("/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Root (avoid “Cannot GET /” confusion)
app.get("/", (req, res) => {
  res.send('KV Dashboard API is running. Try <a href="/health">/health</a> or <a href="/stats/summary">/stats/summary</a>.');
});

// Summary tiles shown on the Dashboard
app.get("/stats/summary", (req, res) => {
  const activeRentals = vehicles.filter((v) => v.status === "out").length;
  const revenue = 12480; // placeholder demo number
  res.json({
    bookingsTotal: bookings.length,
    activeRentals,
    vehicles: vehicles.length,
    revenue,
  });
});

// Vehicles list (for the Vehicles tab)
app.get("/vehicles", (req, res) => {
  res.json(vehicles);
});

// Customers list (for the Customers tab)
app.get("/customers", (req, res) => {
  res.json(customers);
});

// Bookings list (for the Bookings tab)
app.get("/bookings", (req, res) => {
  res.json(bookings);
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`KV API listening on ${PORT}`);
});
