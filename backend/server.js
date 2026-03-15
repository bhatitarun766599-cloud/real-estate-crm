const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const leadRoutes = require("./routes/leads");
const employeeRoutes = require("./routes/employees");

const app = express();

// CORS FIX
app.use(cors());
app.options("*", cors());

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/leads", leadRoutes);
app.use("/employees", employeeRoutes);

app.get("/", (req, res) => {
  res.send("Real Estate CRM API Running 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("CRM Server running on port " + PORT);
});