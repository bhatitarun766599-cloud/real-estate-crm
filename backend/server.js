const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const leadRoutes = require("./routes/leads");
const employeeRoutes = require("./routes/employees");
const setupRoutes = require("./routes/setup");
const syncLeads = require("./sheetSync");

const app = express();

/* ===============================
   MIDDLEWARE
================================ */

app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.use(express.json());

/* ===============================
   API ROUTES
================================ */

app.use("/auth", authRoutes);
app.use("/leads", leadRoutes);
app.use("/employees", employeeRoutes);
app.use("/setup", setupRoutes);

/* ===============================
   SERVE FRONTEND (VERY IMPORTANT)
================================ */

app.use(express.static(path.join(__dirname, "../frontend")));

/* ===============================
   DEFAULT ROUTE (LOGIN PAGE)
================================ */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "login.html"));
});

/* ===============================
   SERVER START
================================ */

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
 console.log(`CRM Server running on port ${PORT}`);
});

/* ===============================
   GOOGLE SHEET AUTO SYNC
================================ */

setInterval(() => {
  console.log("⏳ Syncing leads from Google Sheet...");
  syncLeads();
}, 60000);