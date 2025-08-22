// index.js — KV Rentals API (full replacement)

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ----- ES module dirname helpers -----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ===== CORS: allow production + Vercel previews + localhost =====
const ALLOWED_EXACT = [
  "https://kv-dashboard-client.vercel.app", // your main prod client
  "http://localhost:5173",                  // vite dev
];

// Matches preview deployments like:
// https://kv-dashboard-client-git-main-XXXXX.vercel.app
// https://kv-dashboard-client-somehash.vercel.app
const ALLOW_REGEX = [
  /^https:\/\/kv-dashboard-client(?:-[a-z0-9-]+)?\.vercel\.app$/i,
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // server-to-server, curl, Postman
      if (ALLOWED_EXACT.includes(origin) || ALLOW_REGEX.some((r) => r.test(origin))) {
        return cb(null, true);
      }
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

// ===== Static uploads (ready for future file uploads) =====
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// ===== In-memory demo data (resets on deploy) =====
let vehicles = [
  { id: "veh_1", year: 2022, make: "Toyota", model: "RAV4", vin: "JTMB1RFV0N1234567", color: "White", plate: "ABC-123", currentOdometer: 41250, status: "available" },
  { id: "veh_2", year: 2020, make: "BMW", model: "3 Series", vin: "WBA8D9G58GNU12345", color: "Blue",  plate: "BMW-333", currentOdometer: 65320, status: "out" },
  { id: "veh_3", year: 2019, make: "Ford", model: "Fiesta", vin: "3FADP4EJ2KM123456", color: "Red",   plate: "FOR-555", currentOdometer: 28870, status: "available" },
];

let customers = [
  {
    id: "cus_1",
    name: "Lisa Smith",
    email: "lisa@example.com",
    phone: "+14055550101",
    licenseNumber: "S1234567",
    insurance: { carrier: "Geico", policyNumber: "GEI-99123", expiresAt: "2026-05-31" },
    documents: { driverLicenseUrl: "", insuranceCardUrl: "" },
    address: "123 Ocean Ave, Miami, FL",
  },
  {
    id: "cus_2",
    name: "Thomas Brown",
    email: "thomas@example.com",
    phone: "+14055550102",
    licenseNumber: "B2345678",
    insurance: { carrier: "Progressive", policyNumber: "PRO-77221", expiresAt: "2025-12-31" },
    documents: { driverLicenseUrl: "", insuranceCardUrl: "" },
    address: "45 Broadway, New York, NY",
  },
];

let bookings = [
  {
    id: "bk_1",
    customerId: "cus_1",
    customerName: "Lisa Smith",
    vehicleId: "veh_2",
    vehicleName: "2020 BMW 3 Series",
    plate: "BMW-333",
    startDate: "2025-08-20T10:00:00Z",
    endDate:   "2025-08-22T10:00:00Z",
    status: "active",
    pickupLocation: "Main Office",
    dropoffLocation: "Main Office",
  },
];

// ===== Health & root =====
app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.get("/", (_req, res) => {
  res.send("🚀 KV Rentals API is running. Try /stats/summary, /vehicles, /customers, /bookings");
});

// ===== Summary tiles =====
app.get("/stats/summary", (_req, res) => {
  const activeRentals =
    bookings.filter((b) => b.status === "active").length ||
    vehicles.filter((v) => v.status === "out").length;

  const revenue = 12480; // demo placeholder

  res.json({
    bookingsTotal: bookings.length,
    activeRentals,
    vehicles: vehicles.length,
    revenue,
  });
});

// ===== Vehicles =====
app.get("/vehicles", (_req, res) => {
  res.json(vehicles);
});

app.get("/vehicles/:id", (req, res) => {
  const v = vehicles.find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ error: "Vehicle not found" });
  res.json(v);
});

app.post("/vehicles", (req, res) => {
  const id = `veh_${Date.now()}`;
  const body = req.body || {};
  const newVeh = {
    id,
    year: Number(body.year) || null,
    make: body.make || "",
    model: body.model || "",
    vin: body.vin || "",
    color: body.color || "",
    plate: body.plate || "",
    currentOdometer: Number(body.currentOdometer) || 0,
    status: body.status || "available",
  };
  vehicles.push(newVeh);
  res.status(201).json(newVeh);
});

app.put("/vehicles/:id", (req, res) => {
  const v = vehicles.find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ error: "Vehicle not found" });

  const body = req.body || {};
  const fields = ["year", "make", "model", "vin", "color", "plate", "currentOdometer", "status"];
  fields.forEach((f) => {
    if (body[f] !== undefined) v[f] = f === "year" || f === "currentOdometer" ? Number(body[f]) : body[f];
  });
  res.json(v);
});

// convenience: update odometer only
app.patch("/vehicles/:id/odometer", (req, res) => {
  const v = vehicles.find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ error: "Vehicle not found" });
  const parsed = parseInt(String(req.body?.odometer ?? "").replace(/\D/g, ""), 10);
  if (isNaN(parsed)) return res.status(400).json({ error: "Invalid odometer" });
  v.currentOdometer = parsed;
  res.json(v);
});

// ===== Customers =====
app.get("/customers", (_req, res) => {
  res.json(customers);
});

app.get("/customers/:id", (req, res) => {
  const c = customers.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Customer not found" });
  res.json(c);
});

app.post("/customers", (req, res) => {
  const id = `cus_${Date.now()}`;
  const body = req.body || {};
  const newCus = {
    id,
    name: body.name ?? "",
    email: body.email ?? "",
    phone: body.phone ?? "",
    licenseNumber: body.licenseNumber ?? "",
    address: body.address ?? "",
    insurance: {
      carrier: body.insurance?.carrier ?? "",
      policyNumber: body.insurance?.policyNumber ?? body.insurance?.policy ?? "",
      expiresAt: body.insurance?.expiresAt ?? body.insurance?.expiry ?? "",
    },
    documents: {
      driverLicenseUrl: body.documents?.driverLicenseUrl ?? "",
      insuranceCardUrl: body.documents?.insuranceCardUrl ?? "",
    },
  };
  customers.push(newCus);
  res.status(201).json(newCus);
});

app.put("/customers/:id", (req, res) => {
  const c = customers.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Customer not found" });

  const body = req.body || {};
  if (body.name !== undefined) c.name = body.name;
  if (body.email !== undefined) c.email = body.email;
  if (body.phone !== undefined) c.phone = body.phone;
  if (body.licenseNumber !== undefined) c.licenseNumber = body.licenseNumber;
  if (body.address !== undefined) c.address = body.address;

  if (body.insurance !== undefined) {
    c.insurance = {
      carrier: body.insurance.carrier ?? c.insurance?.carrier ?? "",
      policyNumber: body.insurance.policyNumber ?? body.insurance.policy ?? c.insurance?.policyNumber ?? "",
      expiresAt: body.insurance.expiresAt ?? body.insurance.expiry ?? c.insurance?.expiresAt ?? "",
    };
  }
  if (body.documents !== undefined) {
    c.documents = {
      driverLicenseUrl: body.documents.driverLicenseUrl ?? c.documents?.driverLicenseUrl ?? "",
      insuranceCardUrl: body.documents.insuranceCardUrl ?? c.documents?.insuranceCardUrl ?? "",
    };
  }

  res.json(c);
});

// ===== Bookings (read-only demo) =====
app.get("/bookings", (_req, res) => {
  res.json(bookings);
});

// ===== Start server =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`KV API listening on ${PORT}`);
});
