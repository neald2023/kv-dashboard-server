import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());

// Allow your Vercel frontend to call this API
const ALLOWED_ORIGINS = [
  "https://kv-dashboard-client.vercel.app",
  "http://localhost:5173",
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ---------------- In-memory demo data ----------------
// (This will reset on each deploy; later we’ll swap for a database)
let vehicles = [
  {
    id: "veh_1",
    year: 2021,
    make: "Toyota",
    model: "RAV4",
    vin: "JTMB1RFV1M5123456",
    color: "White",
    plate: "ABC-123",
    currentOdometer: 41250,
    status: "available", // available | out | service
  },
  {
    id: "veh_2",
    year: 2019,
    make: "BMW",
    model: "3 Series",
    vin: "WBA8E3G59GNT12345",
    color: "Gray",
    plate: "BMW-333",
    currentOdometer: 65320,
    status: "out",
  },
  {
    id: "veh_3",
    year: 2020,
    make: "Ford",
    model: "Fiesta",
    vin: "3FADP4BJ4LM123456",
    color: "Blue",
    plate: "FOR-555",
    currentOdometer: 28870,
    status: "available",
  },
];

let customers = [
  {
    id: "cus_1",
    name: "Lisa Smith",
    phone: "+1 555-111-2222",
    email: "lisa@example.com",
    licenseNumber: "S1234567",
    insurance: {
      carrier: "State Farm",
      policyNumber: "STF-88221",
      expiresAt: "2026-04-15",
    },
    documents: {
      driverLicenseUrl: "",
      insuranceCardUrl: "",
    },
  },
  {
    id: "cus_2",
    name: "Thomas Brown",
    phone: "+1 555-333-4444",
    email: "thomas@example.com",
    licenseNumber: "B7654321",
    insurance: {
      carrier: "Progressive",
      policyNumber: "PRG-33449",
      expiresAt: "2025-12-31",
    },
    documents: {
      driverLicenseUrl: "",
      insuranceCardUrl: "",
    },
  },
];

let bookings = [
  {
    id: "bok_1",
    vehicleId: "veh_2",
    customerId: "cus_2",
    pickupAt: "2025-08-22T10:00:00Z",
    dropoffAt: "2025-08-25T10:00:00Z",
    status: "active", // active | completed | cancelled
    startOdometer: 65320,
    endOdometer: null,
  },
];

// ---------------- Health & summary ----------------
app.get("/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.get("/stats/summary", (req, res) => {
  const activeRentals = vehicles.filter((v) => v.status === "out").length;
  const revenue = 12480; // demo number
  res.json({
    bookingsTotal: bookings.length,
    activeRentals,
    vehicles: vehicles.length,
    revenue,
  });
});

// ---------------- Vehicles ----------------
app.get("/vehicles", (req, res) => {
  res.json(vehicles);
});

app.get("/vehicles/:id", (req, res) => {
  const v = vehicles.find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ error: "Vehicle not found" });
  res.json(v);
});

// Update vehicle (odometer, status, etc.)
app.put("/vehicles/:id", (req, res) => {
  const idx = vehicles.findIndex((x) => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Vehicle not found" });

  const allowed = [
    "year",
    "make",
    "model",
    "vin",
    "color",
    "plate",
    "currentOdometer",
    "status",
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) vehicles[idx][key] = req.body[key];
  }
  res.json(vehicles[idx]);
});

// Create a new vehicle (simple id generator)
app.post("/vehicles", (req, res) => {
  const id = "veh_" + Math.random().toString(36).slice(2, 8);
  const v = {
    id,
    year: req.body.year ?? 2024,
    make: req.body.make ?? "",
    model: req.body.model ?? "",
    vin: req.body.vin ?? "",
    color: req.body.color ?? "",
    plate: req.body.plate ?? "",
    currentOdometer: Number(req.body.currentOdometer ?? 0),
    status: req.body.status ?? "available",
  };
  vehicles.push(v);
  res.status(201).json(v);
});

// ---------------- Customers ----------------
app.get("/customers", (req, res) => {
  res.json(customers);
});

app.get("/customers/:id", (req, res) => {
  const c = customers.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Customer not found" });
  res.json(c);
});

// Update customer (including insurance + doc URLs)
app.put("/customers/:id", (req, res) => {
  const idx = customers.findIndex((x) => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Customer not found" });

  const allowed = [
    "name",
    "phone",
    "email",
    "licenseNumber",
    "insurance",
    "documents",
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) customers[idx][key] = req.body[key];
  }
  res.json(customers[idx]);
});

// Create customer
app.post("/customers", (req, res) => {
  const id = "cus_" + Math.random().toString(36).slice(2, 8);
  const c = {
    id,
    name: req.body.name ?? "",
    phone: req.body.phone ?? "",
    email: req.body.email ?? "",
    licenseNumber: req.body.licenseNumber ?? "",
    insurance: {
      carrier: req.body.insurance?.carrier ?? "",
      policyNumber: req.body.insurance?.policyNumber ?? "",
      expiresAt: req.body.insurance?.expiresAt ?? "",
    },
    documents: {
      driverLicenseUrl: req.body.documents?.driverLicenseUrl ?? "",
      insuranceCardUrl: req.body.documents?.insuranceCardUrl ?? "",
    },
  };
  customers.push(c);
  res.status(201).json(c);
});

// ---------------- Bookings (read-only for now) ----------------
app.get("/bookings", (req, res) => {
  res.json(bookings);
});

// ---------------- Root ----------------
app.get("/", (req, res) => {
  res.send("KV Dashboard API is running. Try /health or /stats/summary");
});

// ---------------- Start server ----------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`KV API listening on ${PORT}`);
});
