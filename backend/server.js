const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const authRoutes = require("./routes/auth");
const leadRoutes = require("./routes/leads");
const employeeRoutes = require("./routes/employees");
const syncLeads = require("./sheetSync"); // ✅ added

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
   DATABASE
================================ */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect()
.then(()=> console.log("PostgreSQL Connected ✅"))
.catch(err=> console.error("DB Connection Error ❌",err));

/* ===============================
   ROUTES
================================ */

app.use("/auth", authRoutes);
app.use("/leads", leadRoutes);
app.use("/employees", employeeRoutes);

/* ===============================
   HEALTH CHECK
================================ */

app.get("/", (req,res)=>{
 res.send("Real Estate CRM API Running 🚀");
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