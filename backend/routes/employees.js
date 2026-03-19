const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

/* ===============================
   ADD EMPLOYEE (MANAGER ONLY)
================================ */
router.post("/add", auth, async (req, res) => {
  try {

    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name,email,password,role)
       VALUES ($1,$2,$3,'employee')
       RETURNING id,name,email,role`,
      [name, email, hashedPassword]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to add employee" });
  }
});

/* ===============================
   GET ALL EMPLOYEES + STATS
================================ */
router.get("/", auth, async (req, res) => {
  try {

    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await pool.query(
      `SELECT u.id,u.name,u.email,u.role,
        COUNT(l.id) as total_leads
       FROM users u
       LEFT JOIN leads l ON l.assigned_to = u.id
       WHERE u.role='employee'
       GROUP BY u.id
       ORDER BY u.id`
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

/* ===============================
   GET SINGLE EMPLOYEE DETAILS
================================ */
router.get("/:id", auth, async (req, res) => {
  try {

    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Access denied" });
    }

    const employee = await pool.query(
      "SELECT id,name,email FROM users WHERE id=$1 AND role='employee'",
      [req.params.id]
    );

    const leads = await pool.query(
      "SELECT * FROM leads WHERE assigned_to=$1 ORDER BY created_at DESC",
      [req.params.id]
    );

    res.json({
      employee: employee.rows[0],
      leads: leads.rows
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed employee details" });
  }
});

/* ===============================
   UPDATE EMPLOYEE
================================ */
router.put("/:id", auth, async (req, res) => {
  try {

    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { name, email } = req.body;

    const result = await pool.query(
      "UPDATE users SET name=$1,email=$2 WHERE id=$3 RETURNING *",
      [name, email, req.params.id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Update failed" });
  }
});

/* ===============================
   DELETE EMPLOYEE
================================ */
router.delete("/:id", auth, async (req, res) => {
  try {

    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Access denied" });
    }

    await pool.query(
      "DELETE FROM users WHERE id=$1 AND role='employee'",
      [req.params.id]
    );

    res.json({ message: "Employee deleted" });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;