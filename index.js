// --- KV Dashboard Server (CommonJS) ---
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { randomUUID } = require("crypto");

const app = express();
app.use(express.json());

// allow only your client origin in production
const ORIGIN = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: ORIGIN, methods: ["GET","POST","OPTIONS"] }));

// ----- in‑memory stores (good for going live today) -----
const messages = [];                  // chat messages
const punchesByDate = {};             // time clock punches (keyed by yyyy-mm-dd)
const todayKey = () => new Date().toISOString().slice(0,10);

// health
app.get("/health", (_req,res) => res.json({ ok: true }));

// chat
app.get("/chat", (_req,res) => res.json(messages));
app.post("/chat", (req,res) => {
  const { name = "User", content } = req.body || {};
  if (!content) return res.status(400).json({ error: "content required" });
  const msg = { id: randomUUID(), name, content, ts: Date.now() };
  messages.push(msg);
  io.emit("chat:new", msg);
  res.json(msg);
});

// time clock
app.get("/clock/today", (_req,res) => {
  res.json(punchesByDate[todayKey()] || []);
});
app.post("/clock/punch", (req,res) => {
  const { user = "User", action } = req.body || {};
  if (!["in","out"].includes(action)) return res.status(400).json({ error: "action must be in|out" });
  const k = todayKey();
  punchesByDate[k] ??= [];
  const entry = { id: randomUUID(), user, action, ts: Date.now() };
  punchesByDate[k].push(entry);
  io.emit("clock:new", entry);
  res.json(entry);
});

// --- socket.io (for live chat/clock updates) ---
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: ORIGIN } });

io.on("connection", () => {
  /* no-op; events are emitted from routes above */
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
