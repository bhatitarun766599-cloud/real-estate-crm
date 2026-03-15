const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const authRoutes = require("./routes/auth");
const leadRoutes = require("./routes/leads");
const employeeRoutes = require("./routes/employees");

const app = express();

app.use(cors());
app.use(express.json());

/* PostgreSQL Connection */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log("PostgreSQL Connected ✅"))
  .catch(err => console.error("DB Connection Error ❌", err));

/* Routes */

app.use("/auth", authRoutes);
app.use("/leads", leadRoutes);
app.use("/employees", employeeRoutes);

app.get("/", (req, res) => {
  res.send("Real Estate CRM API Running 🚀");
});

/* Server */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("CRM Server running on port " + PORT);
});