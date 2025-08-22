// index.js (full replacement)

// -------------------- Imports --------------------
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

// -------------------- Server Setup --------------------
const app = express();
app.use(express.json());

// ---- CORS (allow your Vercel app + localhost dev) ----
const ALLOWED_ORIGINS = [
  "https://kv-dashboard-client.vercel.app", // your live client
  "http://localhost:5173",                   // Vite dev
];
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // allow server-to-server / curl
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("CORS: origin not allowed"), false);
    },
    credentials: true,
  })
);

// ---- Ensure /uploads exists & serve it statically ----
const UPLOAD_DIR = path.resolve("uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));

// -------------------- Multer (file uploads) --------------------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname || "").slice(0, 10);
    cb(null, Date.now() + safeExt);
  },
});
const upload = multer({ storage });

// -------------------- Demo Data (in-memory) --------------------
let vehicles = [
  {
    id: "veh_1",
    year: 2022,
    make: "Toyota",
    model: "RAV4",
    vin: "JTMB1234567890001",
    color: "Gray",
    plate: "ABC-123",
    currentOdometer: 41250,
    status: "available", // available | out | service
  },
  {
    id: "veh_2",
    year: 2019,
    make: "BMW",
    model: "3 Series",
    vin: "WBA8E1G58GNU00002",
    color: "Black",
    plate: "BMW-333",
    currentOdometer: 65320,
    status: "out",
  },
  {
    id: "veh_3",
    year: 2021,
    make: "Ford",
    model: "Fiesta",
    vin: "3FADP4BJ0BMU00003",
    color: "Blue",
    plate: "FOR-555",
    currentOdometer: 28870,
    status: "available",
  },
];

let customers = [
  {
    id: "cus_1",
    name: "John Doe",
    phone: "401-555-1234",
    email: "john@example.com",
    insurance: {
      company: "GEICO",
      policyNumber: "ABC123456",
      expirationDate: "2025-12-31",
    },
    licensePhoto: null, // '/uploads/12345.jpg'
  },
  {
    id: "cus_2",
    name: "Lisa Smith",
    phone: "401-555-5678",
    email: "lisa@example.com",
    insurance: {
      company: "Progressive",
      policyNumber: "PGR-778899",
      expirationDate: "2026-06-30",
    },
    licensePhoto: null,
  },
];

let bookings = [
  {
    id: "bk_1",
    vehicleId: "veh_2",
    customerId: "cus_1",
    startDate: "2025-08-18T10:00:00Z",
    endDate: "2025-08-20T10:00:00Z",
    status: "active", // active | reserved | returned | cancelled
    pickupLocation: "Main Office",
    dropoffLocation: "Main Office",
    estMilesIncluded: 300,
    price: 220,
  },
];

// -------------------- Health --------------------
app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// -------------------- Summary Tiles --------------------
app.get("/stats/summary", (_req, res) => {
  const activeRentals = vehicles.filter((v) => v.status === "out").length;
  const revenue = 12480; // demo placeholder
  res.json({
    bookingsTotal: bookings.length,
    activeRentals,
    vehicles: vehicles.length,
    revenue,
  });
});

// -------------------- Vehicles --------------------
app.get("/vehicles", (_req, res) => {
  res.json(vehicles);
});

// Create vehicle (simple demo)
app.post("/vehicles", (req, res) => {
  const v = req.body || {};
  const id = `veh_${Date.now()}`;
  const newVeh = {
    id,
    year: Number(v.year) || null,
    make: v.make || "",
    model: v.model || "",
    vin: v.vin || "",
    color: v.color || "",
    plate: v.plate || "",
    currentOdometer: Number(v.currentOdometer) || 0,
    status: v.status || "available",
  };
  vehicles.push(newVeh);
  res.json(newVeh);
});

// Update basic fields (odometer/status/etc.)
app.put("/vehicles/:id", (req, res) => {
  const veh = vehicles.find((x) => x.id === req.params.id);
  if (!veh) return res.status(404).json({ error: "Vehicle not found" });

  const v = req.body || {};
  if (v.year !== undefined) veh.year = Number(v.year);
  if (v.make !== undefined) veh.make = v.make;
  if (v.model !== undefined) veh.model = v.model;
  if (v.vin !== undefined) veh.vin = v.vin;
  if (v.color !== undefined) veh.color = v.color;
  if (v.plate !== undefined) veh.plate = v.plate;

  // normalize odometer so '023' becomes 23 (fixes your leading-zero pain)
  if (v.currentOdometer !== undefined) {
    const parsed = parseInt(String(v.currentOdometer).replace(/\D/g, ""), 10);
    veh.currentOdometer = isNaN(parsed) ? veh.currentOdometer : parsed;
  }

  if (v.status !== undefined) veh.status = v.status;
  res.json(veh);
});

// Update odometer only
app.put("/vehicles/:id/odometer", (req, res) => {
  const veh = vehicles.find((x) => x.id === req.params.id);
  if (!veh) return res.status(404).json({ error: "Vehicle not found" });

  const raw = req.body?.odometer;
  const parsed = parseInt(String(raw).replace(/\D/g, ""), 10);
  if (isNaN(parsed)) return res.status(400).json({ error: "Invalid odometer" });

  veh.currentOdometer = parsed;
  res.json({ ok: true, vehicle: veh });
});

// -------------------- Customers --------------------
app.get("/customers", (_req, res) => {
  res.json(customers);
});

// Create customer (demo)
app.post("/customers", (req, res) => {
  const c = req.body || {};
  const id = `cus_${Date.now()}`;
  const newCus = {
    id,
    name: c.name || "",
    phone: c.phone || "",
    email: c.email || "",
    insurance: c.insurance || {
      company: "",
      policyNumber: "",
      expirationDate: "",
    },
    licensePhoto: null,
  };
  customers.push(newCus);
  res.json(newCus);
});

// Update customer fields
app.put("/customers/:id", (req, res) => {
  const cus = customers.find((x) => x.id === req.params.id);
  if (!cus) return res.status(404).json({ error: "Customer not found" });

  const c = req.body || {};
  if (c.name !== undefined) cus.name = c.name;
  if (c.phone !== undefined) cus.phone = c.phone;
  if (c.email !== undefined) cus.email = c.email;
  if (c.insurance !== undefined) {
    cus.insurance = {
      company: c.insurance.company || "",
      policyNumber: c.insurance.policyNumber || "",
      expirationDate: c.insurance.expirationDate || "",
    };
  }
  res.json(cus);
});

// Update insurance only
app.post("/customers/:id/insurance", (req, res) => {
  const cus = customers.find((x) => x.id === req.params.id);
  if (!cus) return res.status(404).json({ error: "Customer not found" });

  const { company, policyNumber, expirationDate } = req.body || {};
  cus.insurance = {
    company: company || "",
    policyNumber: policyNumber || "",
    expirationDate: expirationDate || "",
  };
  res.json({ ok: true, customer: cus });
});

// Upload driver’s license photo (form field name: 'licensePhoto')
app.post(
  "/customers/:id/license",
  upload.single("licensePhoto"),
  (req, res) => {
    const cus = customers.find((x) => x.id === req.params.id);
    if (!cus) return res.status(404).json({ error: "Customer not found" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // public URL to the file
    const publicPath = `/uploads/${req.file.filename}`;
    cus.licensePhoto = publicPath;

    res.json({
      ok: true,
      customer: cus,
      fileUrl: publicPath,
    });
  }
);

// -------------------- Bookings --------------------
app.get("/bookings", (_req, res) => {
  res.json(bookings);
});

// -------------------- Root / Help --------------------
app.get("/", (_req, res) => {
  res.send("KV API is running. Try /health, /stats/summary, /vehicles, /customers, /bookings");
});

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`KV API listening on ${PORT}`);
});
