const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

/* ===============================
   ROUND ROBIN (USERS TABLE)
================================ */
async function getNextEmployee() {

  const employees = await pool.query(
    "SELECT id FROM users WHERE role='employee' ORDER BY id"
  );

  if (employees.rows.length === 0) {
    console.log("⚠️ No employees found");
    return 1;
  }

  let rotation = await pool.query(
    "SELECT * FROM lead_rotation LIMIT 1"
  );

  if (rotation.rows.length === 0) {
    await pool.query(
      "INSERT INTO lead_rotation (last_employee_id) VALUES ($1)",
      [employees.rows[0].id]
    );
    return employees.rows[0].id;
  }

  let last = rotation.rows[0].last_employee_id;

  let index = employees.rows.findIndex(e => e.id === last);
  if (index === -1) index = 0;

  let nextEmployee =
    employees.rows[(index + 1) % employees.rows.length].id;

  await pool.query(
    "UPDATE lead_rotation SET last_employee_id=$1",
    [nextEmployee]
  );

  return nextEmployee;
}

/* ===============================
   ADD LEAD
================================ */
router.post("/add", async (req, res) => {
  try {

    const {
      name,
      phone,
      email,
      city,
      property_interest,
      budget,
      notes,
      source
    } = req.body;

    const exists = await pool.query(
      "SELECT id FROM leads WHERE phone=$1",
      [phone]
    );

    if (exists.rows.length > 0) {
      return res.json({ message: "Duplicate skipped" });
    }

    const employee = await getNextEmployee();

    const newLead = await pool.query(
      `INSERT INTO leads
      (name,phone,email,city,property_interest,budget,notes,source,assigned_to,status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'new')
      RETURNING *`,
      [name,phone,email,city,property_interest,budget,notes,source,employee]
    );

    res.json(newLead.rows[0]);

  } catch (err) {
    console.error("ADD ERROR:", err);
    res.status(500).json({ error: "Failed to add lead" });
  }
});

/* ===============================
   GET LEADS
================================ */
router.get("/", auth, async (req, res) => {
  try {

    let result;

    if (req.user.role === "manager") {
      result = await pool.query(
        "SELECT * FROM leads ORDER BY created_at DESC"
      );
    } else {
      result = await pool.query(
        "SELECT * FROM leads WHERE assigned_to=$1 ORDER BY created_at DESC",
        [req.user.id]
      );
    }

    res.json(result.rows);

  } catch (err) {
    console.error("GET ERROR:", err);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

/* ===============================
   UPDATE
================================ */
router.put("/update/:id", auth, async (req, res) => {
  try {

    const { status, remark } = req.body;

    const lead = await pool.query(
      "UPDATE leads SET status=$1 WHERE id=$2 RETURNING *",
      [status, req.params.id]
    );

    if (remark) {
      await pool.query(
        "INSERT INTO notes (lead_id, employee_id, note) VALUES ($1,$2,$3)",
        [req.params.id, req.user.id, remark]
      );
    }

    res.json(lead.rows[0]);

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/* ===============================
   STATS
================================ */
router.get("/stats", auth, async (req, res) => {
  try {

    const condition =
      req.user.role === "manager"
        ? ""
        : `AND assigned_to=${req.user.id}`;

    const today = await pool.query(
      `SELECT COUNT(*) FROM leads
       WHERE DATE(created_at)=CURRENT_DATE ${condition}`
    );

    const yesterday = await pool.query(
      `SELECT COUNT(*) FROM leads
       WHERE DATE(created_at)=CURRENT_DATE - INTERVAL '1 day' ${condition}`
    );

    res.json({
      today: today.rows[0].count,
      yesterday: yesterday.rows[0].count
    });

  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ error: "Stats failed" });
  }
});

module.exports = router;

/* ===============================
   MANAGER ANALYTICS
================================ */
router.get("/analytics", auth, async (req, res) => {
  try {

    // Only manager
    if (req.user.role !== "manager") {
      return res.status(403).json({ error: "Access denied" });
    }

    const total = await pool.query(
      "SELECT COUNT(*) FROM leads"
    );

    const today = await pool.query(
      "SELECT COUNT(*) FROM leads WHERE DATE(created_at)=CURRENT_DATE"
    );

    const employees = await pool.query(
      `SELECT e.name, COUNT(l.id) as total
       FROM employees e
       LEFT JOIN leads l ON l.assigned_to = e.id
       GROUP BY e.name`
    );

    res.json({
      total: total.rows[0].count,
      today: today.rows[0].count,
      employees: employees.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analytics error" });
  }
});