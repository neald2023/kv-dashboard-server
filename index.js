// index.js — KV Rentals demo API (Express + CORS, in-memory data)
import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());

// ----- CORS: allow your Vercel site, local dev and previews -----
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // curl/Postman
  try {
    const url = new URL(origin);
    const host = url.hostname;

    // your production client
    if (origin === "https://kv-dashboard-client.vercel.app") return true;

    // Vercel previews (git-main-xxx.vercel.app etc.)
    if (host.endsWith(".vercel.app")) return true;

    // local dev
    if (origin === "http://localhost:5173" || origin === "http://127.0.0.1:5173")
      return true;
  } catch {
    // not a URL
  }
  return false;
};

app.use(
  cors({
    origin: (origin, cb) => (isAllowedOrigin(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS"))),
    credentials: true,
  })
);

// ----- Demo data (in-memory). This resets every deploy/restart -----
let vehicles = [
  {
    id: "veh_1",
    year: 2022,
    make: "Toyota",
    model: "RAV4",
    name: "2022 Toyota RAV4",
    vin: "JTMB1RFV9N1234567",
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
    name: "2019 BMW 3 Series",
    vin: "WBA8E1C57G1234567",
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
    name: "2021 Ford Fiesta",
    vin: "3FADP4BJ1BM123456",
    color: "Blue",
    plate: "FOR-555",
    currentOdometer: 28870,
    status: "available",
  },
];

let customers = [
  {
    id: "cust_1",
    name: "Lisa Smith",
    email: "lisa@example.com",
    phone: "555-111-2222",
    licenseNumber: "S1234567",
    address: "123 Main St, Atlanta, GA",
    insurance: {
      carrier: "State Farm",
      policyNumber: "SF-123-456",
      expiresAt: "2026-06-30",
    },
    documents: {
      driverLicenseUrl: "",
      insuranceCardUrl: "",
    },
  },
  {
    id: "cust_2",
    name: "Thomas Brown",
    email: "thomas@example.com",
    phone: "555-222-3333",
    licenseNumber: "B7654321",
    address: "77 Peachtree St, Atlanta, GA",
    insurance: {
      carrier: "Geico",
      policyNumber: "GE-456-789",
      expiresAt: "2025-12-31",
    },
    documents: {
      driverLicenseUrl: "",
      insuranceCardUrl: "",
    },
  },
];

let bookings = [
  // example: completed booking with price for revenue calc
  {
    id: "book_1",
    customerId: "cust_1",
    vehicleId: "veh_1",
    startDate: "2025-08-01T10:00:00Z",
    endDate: "2025-08-03T16:00:00Z",
    status: "completed", // active | completed | canceled
    notes: "Weekend rental",
    price: 180.0,
  },
];

// ----- Helpers -----
const startedAt = Date.now();
const findById = (arr, id) => arr.find((x) => x.id === id);

// ----- Root/help -----
app.get("/", (_req, res) => {
  res.send(
    "KV Dashboard API is running. Try /health, /stats/summary, /vehicles, /customers, /bookings"
  );
});

// ----- Health -----
app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: (Date.now() - startedAt) / 1000 });
});

// ----- Stats for Dashboard tiles -----
app.get("/stats/summary", (_req, res) => {
  const activeRentals = bookings.filter((b) => b.status === "active").length;
  const revenue = bookings
    .filter((b) => b.status === "completed" && typeof b.price === "number")
    .reduce((sum, b) => sum + b.price, 0);

  res.json({
    bookingsTotal: bookings.length,
    activeRentals,
    vehicles: vehicles.length,
    revenue, // number
  });
});

// ================== VEHICLES ==================

// list
app.get("/vehicles", (_req, res) => res.json(vehicles));

// get one
app.get("/vehicles/:id", (req, res) => {
  const v = findById(vehicles, req.params.id);
  if (!v) return res.status(404).json({ error: "Vehicle not found" });
  res.json(v);
});

// create
app.post("/vehicles", (req, res) => {
  const b = req.body || {};
  if (!b.year || !b.make || !b.model || !b.plate)
    return res
      .status(400)
      .json({ error: "Required: year, make, model, plate" });

  const newVehicle = {
    id: `veh_${Date.now()}`,
    year: Number(b.year),
    make: b.make,
    model: b.model,
    name: `${b.year} ${b.make} ${b.model}`,
    vin: b.vin || "",
    color: b.color || "",
    plate: b.plate,
    currentOdometer: Number(b.currentOdometer || 0),
    status: b.status || "available",
  };
  vehicles.push(newVehicle);
  res.status(201).json(newVehicle);
});

// update
app.put("/vehicles/:id", (req, res) => {
  const v = findById(vehicles, req.params.id);
  if (!v) return res.status(404).json({ error: "Vehicle not found" });

  const b = req.body || {};
  if (b.year !== undefined) v.year = Number(b.year);
  if (b.make !== undefined) v.make = b.make;
  if (b.model !== undefined) v.model = b.model;
  v.name = `${v.year} ${v.make} ${v.model}`;
  if (b.vin !== undefined) v.vin = b.vin;
  if (b.color !== undefined) v.color = b.color;
  if (b.plate !== undefined) v.plate = b.plate;
  if (b.currentOdometer !== undefined)
    v.currentOdometer = Number(b.currentOdometer);
  if (b.status !== undefined) v.status = b.status; // available | out | service

  res.json(v);
});

// ================== CUSTOMERS ==================

// list
app.get("/customers", (_req, res) => res.json(customers));

// get one
app.get("/customers/:id", (req, res) => {
  const c = findById(customers, req.params.id);
  if (!c) return res.status(404).json({ error: "Customer not found" });
  res.json(c);
});

// create
app.post("/customers", (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.phone)
    return res.status(400).json({ error: "Required: name, phone" });

  const newCustomer = {
    id: `cust_${Date.now()}`,
    name: b.name,
    email: b.email || "",
    phone: b.phone,
    licenseNumber: b.licenseNumber || "",
    address: b.address || "",
    insurance: {
      carrier: b.insurance?.carrier || "",
      policyNumber: b.insurance?.policyNumber || "",
      expiresAt: b.insurance?.expiresAt || "",
    },
    documents: {
      driverLicenseUrl: b.documents?.driverLicenseUrl || "",
      insuranceCardUrl: b.documents?.insuranceCardUrl || "",
    },
  };
  customers.push(newCustomer);
  res.status(201).json(newCustomer);
});

// update
app.put("/customers/:id", (req, res) => {
  const c = findById(customers, req.params.id);
  if (!c) return res.status(404).json({ error: "Customer not found" });

  const b = req.body || {};
  if (b.name !== undefined) c.name = b.name;
  if (b.email !== undefined) c.email = b.email;
  if (b.phone !== undefined) c.phone = b.phone;
  if (b.licenseNumber !== undefined) c.licenseNumber = b.licenseNumber;
  if (b.address !== undefined) c.address = b.address;

  if (b.insurance !== undefined) {
    c.insurance = {
      carrier: b.insurance.carrier ?? c.insurance?.carrier ?? "",
      policyNumber: b.insurance.policyNumber ?? c.insurance?.policyNumber ?? "",
      expiresAt: b.insurance.expiresAt ?? c.insurance?.expiresAt ?? "",
    };
  }
  if (b.documents !== undefined) {
    c.documents = {
      driverLicenseUrl:
        b.documents.driverLicenseUrl ?? c.documents?.driverLicenseUrl ?? "",
      insuranceCardUrl:
        b.documents.insuranceCardUrl ?? c.documents?.insuranceCardUrl ?? "",
    };
  }

  res.json(c);
});

// ================== BOOKINGS ==================

// create booking
app.post("/bookings", (req, res) => {
  const b = req.body || {};
  if (!b.customerId || !b.vehicleId || !b.startDate || !b.endDate) {
    return res
      .status(400)
      .json({
        error: "Missing required: customerId, vehicleId, startDate, endDate",
      });
  }

  const customer = findById(customers, b.customerId);
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const vehicle = findById(vehicles, b.vehicleId);
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

  if (vehicle.status === "out") {
    return res.status(409).json({ error: "Vehicle is currently out" });
  }

  const newBooking = {
    id: `book_${Date.now()}`,
    customerId: b.customerId,
    vehicleId: b.vehicleId,
    startDate: b.startDate,
    endDate: b.endDate,
    status: "active", // active | completed | canceled
    notes: b.notes ?? "",
    price: typeof b.price === "number" ? b.price : null,
  };
  bookings.push(newBooking);

  // mark vehicle out
  vehicle.status = "out";

  res.status(201).json(newBooking);
});

// list bookings
app.get("/bookings", (_req, res) => {
  const enriched = bookings.map((bk) => ({
    ...bk,
    customer: findById(customers, bk.customerId)?.name || null,
    vehicle: findById(vehicles, bk.vehicleId)?.name || null,
  }));
  res.json(enriched);
});

// get one booking
app.get("/bookings/:id", (req, res) => {
  const b = findById(bookings, req.params.id);
  if (!b) return res.status(404).json({ error: "Booking not found" });
  res.json({
    ...b,
    customer: findById(customers, b.customerId) || null,
    vehicle: findById(vehicles, b.vehicleId) || null,
  });
});

// update booking
app.put("/bookings/:id", (req, res) => {
  const bk = findById(bookings, req.params.id);
  if (!bk) return res.status(404).json({ error: "Booking not found" });

  const b = req.body || {};
  if (b.startDate !== undefined) bk.startDate = b.startDate;
  if (b.endDate !== undefined) bk.endDate = b.endDate;
  if (b.notes !== undefined) bk.notes = b.notes;
  if (b.price !== undefined) bk.price = b.price;

  if (b.status !== undefined) {
    bk.status = b.status; // active | completed | canceled

    // sync vehicle status
    const vehicle = findById(vehicles, bk.vehicleId);
    if (vehicle) {
      if (bk.status === "completed" || bk.status === "canceled") {
        vehicle.status = "available";
      } else if (bk.status === "active") {
        vehicle.status = "out";
      }
    }
  }

  res.json(bk);
});

// delete/cancel booking (simple)
app.delete("/bookings/:id", (req, res) => {
  const idx = bookings.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Booking not found" });

  const [removed] = bookings.splice(idx, 1);
  const vehicle = findById(vehicles, removed.vehicleId);
  if (vehicle) vehicle.status = "available";

  res.json({ ok: true, removedId: removed.id });
});

// ----- Start server -----
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`KV API listening on ${PORT}`);
});
