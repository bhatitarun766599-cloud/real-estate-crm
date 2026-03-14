const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();


// ADD EMPLOYEE
router.post("/add", async (req, res) => {

  try {

    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO employees (name,email,password)
       VALUES ($1,$2,$3) RETURNING id,name,email`,
      [name, email, hashedPassword]
    );

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err.message);
    res.status(500).send("Server Error");

  }

});


// GET ALL EMPLOYEES
router.get("/all", async (req, res) => {

  try {

    const employees = await pool.query(
      "SELECT id,name,email FROM employees"
    );

    res.json(employees.rows);

  } catch (err) {

    console.error(err.message);
    res.status(500).send("Server Error");

  }

});


// EMPLOYEE LOGIN
router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM employees WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email"
      });
    }

    const employee = result.rows[0];

    const validPassword = await bcrypt.compare(
      password,
      employee.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      { id: employee.id, role: "employee" },
      process.env.JWT_SECRET || "crm_secret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token: token,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email
      }
    });

  } catch (err) {

    console.error(err.message);
    res.status(500).send("Server Error");

  }

});


module.exports = router;