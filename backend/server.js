const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const leadRoutes = require("./routes/leads");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/leads", leadRoutes);

app.get("/", (req, res) => {
  res.send("Real Estate CRM API Running 🚀");
});

app.listen(3000, () => {
  console.log("CRM Server running on port 3000");
});
const employeeRoutes = require("./routes/employees");
app.use("/employees", employeeRoutes);
