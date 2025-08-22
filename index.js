// index.js — KV Rentals API (demo / mock storage)

import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---------- CORS ----------
const CLIENT_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const allowed = [CLIENT_ORIGIN, "http://localhost:5173", "http://localhost:3000"];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowed.includes("*") || allowed.includes(origin)) return cb(null, true);
      cb(new Error(`Not allowed by CORS: ${origin}`));
    },
  })
);

// ---------- Parsers ----------
app.use(express.json());

// ---------- Static for uploads ----------
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use("/uploads", express.static(uploadsDir));

// ---------- File upload (license photo) ----------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});
const upload = multer({ storage });

// ---------- Demo in-memory data ----------
let vehicles = [
  { id: "veh_1", year: 2022, make: "Toyota", model: "RAV4", vin: "JTMB1RFV0N1234567", color: "White", licensePlate: "ABC-123", odometer: 41250, status: "available" },
  { id: "veh_2", year: 2020, make: "BMW", model: "3 Series", vin: "WBA8D9G58GNU12345", color: "Blue", licensePlate: "BMW-333", odometer: 65320, status: "out" },
  { id: "veh_3", year: 2019, make: "Ford", model: "Fiesta", vin: "3FADP4EJ2KM123456", color: "Red", licensePlate: "FOR-555", odometer: 28870, status: "available" }
];

let customers = [
  {
    id: "cus_1",
    name: "Lisa Smith",
    email: "lisa@example.com",
    phone: "+14055550101",
    driverLicenseNumber: "S1234567",
    insurance: { name: "Geico", policyNumber: "GEI-99123", expirationDate: "2026-05-31" },
    licensePhotoUrl: null
  },
  {
    id: "cus_2",
    name: "Thomas Brown",
    email: "thomas@example.com",
    phone: "+14055550102",
    driverLicenseNumber: "B2345678",
    insurance: { name: "Progressive", policyNumber: "PRO-77221", expirationDate: "2025-12-31" },
    licensePhotoUrl: null
  }
];

let bookings = [
  { id: "bk_1", customerId: "cus_1", vehicleId: "veh_2", startDate: "2025-08-20", endDate: "2025-08-22", status: "active", total: 240.0 }
];

// ---------- Health + Home ----------
app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.get("/", (_req, res) => {
  res.send("🚀 KV Rentals API is running. Try /stats/summary, /vehicles, /customers, /bookings");
});

// ---------- Stats ----------
app.get("/stats/summary", (_req, res) => {
  const activeRentals =
    bookings.filter(b => b.status === "active").length ||
    vehicles.filter(v => v.status === "out").length;

  const revenue = 12480; // demo placeholder

  res.json({
    bookingsTotal: bookings.length,
    activeRentals,
    vehicles: vehicles.length,
    revenue
  });
});

// ---------- Vehicles ----------
app.get("/vehicles", (_req, res) => {
  res.json(vehicles);
});

app.post("/vehicles", (req, res) => {
  const { year, make, model, vin, color, licensePlate, odometer, status = "available" } = req.body;
  const id = `veh_${Date.now()}`;
  const newVeh = { id, year: Number(year), make, model, vin, color, licensePlate, odometer: Number(odometer) || 0, status };
  vehicles.push(newVeh);
  res.status(201).json(newVeh);
});

app.put("/vehicles/:id", (req, res) => {
  const v = vehicles.find(v => v.id === req.params.id);
  if (!v) return res.status(404).json({ error: "Vehicle not found" });

  const fields = ["year", "make", "model", "vin", "color", "licensePlate", "odometer", "status"];
  for (const f of fields) {
    if (req.body[f] !== undefined) v[f] = f === "odometer" || f === "year" ? Number(req.body[f]) : req.body[f];
  }
  res.json(v);
});

// convenience endpoint for odometer-only update
app.patch("/vehicles/:id/odometer", (req, res) => {
  const v = vehicles.find(v => v.id === req.params.id);
  if (!v) return res.status(404).json({ error: "Vehicle not found" });
  v.odometer = Number(req.body.odometer) || v.odometer;
  res.json(v);
});

// ---------- Customers ----------
app.get("/customers", (_req, res) => {
  res.json(customers);
});

// create customer with optional license photo
app.post("/customers", upload.single("licensePhoto"), (req, res) => {
  const { name, email, phone, driverLicenseNumber, insuranceName, policyNumber, expirationDate } = req.body;

  const id = `cus_${Date.now()}`;
  const licensePhotoUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const newCustomer = {
    id,
    name,
    email,
    phone,
    driverLicenseNumber,
    insurance: {
      name: insuranceName || "",
      policyNumber: policyNumber || "",
      expirationDate: expirationDate || ""
    },
    licensePhotoUrl
  };

  customers.push(newCustomer);
  res.status(201).json(newCustomer);
});

// update customer (you can also upload a new license photo)
app.put("/customers/:id", upload.single("licensePhoto"), (req, res) => {
  const c = customers.find(c => c.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Customer not found" });

  const { name, email, phone, driverLicenseNumber, insuranceName, policyNumber, expirationDate } = req.body;
  if (name !== undefined) c.name = name;
  if (email !== undefined) c.email = email;
  if (phone !== undefined) c.phone = phone;
  if (driverLicenseNumber !== undefined) c.driverLicenseNumber = driverLicenseNumber;

  c.insurance = {
    name: insuranceName ?? c.insurance?.name ?? "",
    policyNumber: policyNumber ?? c.insurance?.policyNumber ?? "",
    expirationDate: expirationDate ?? c.insurance?.expirationDate ?? ""
  };

  if (req.file) c.licensePhotoUrl = `/uploads/${req.file.filename}`;

  res.json(c);
});

// ---------- Bookings (placeholder list) ----------
app.get("/bookings", (_req, res) => {
  res.json(bookings);
});

// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`KV API listening on ${PORT}`);
});
