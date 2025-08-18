const express = require("express");
const cors = require("cors");
const app = express();

// ✅ Allow your frontend domain
const allowedOrigins = [
  "http://localhost:5173", // local dev
  "https://kv-dashboard-client.vercel.app" // your Vercel frontend
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// rest of your code
app.use(express.json());
