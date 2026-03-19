const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

/* ===============================
   ROUND ROBIN ASSIGNMENT
================================ */
async function getNextEmployee() {

  const employees = await pool.query(
    "SELECT id FROM employees WHERE status='active' ORDER BY id"
  );

  if (employees.rows.length === 0) {
    throw new Error("No active employees found");
  }

  const rotation = await pool.query(
    "SELECT last_employee_id FROM lead_rotation LIMIT 1"
  );

  let last = rotation.rows[0]?.last_employee_id || null;

  let index = employees.rows.findIndex(e => e.id === last);

  let nextEmployee =
    employees.rows[(index + 1) % employees.rows.length].id;

  await pool.query(
    "UPDATE lead_rotation SET last_employee_id=$1",
    [nextEmployee]
  );

  return nextEmployee;
}

/* ===============================
   ADD LEAD (AUTO ASSIGN)
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

    // 🚫 Duplicate check
    const exists = await pool.query(
      "SELECT id FROM leads WHERE phone=$1",
      [phone]
    );

    if (exists.rows.length > 0) {
      return res.json({ message: "Duplicate lead skipped" });
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
    console.error(err);
    res.status(500).json({ error: "Failed to add lead" });
  }
});

/* ===============================
   GET LEADS (ROLE BASED)
================================ */
router.get("/", auth, async (req, res) => {
  try {

    let result;

    if (req.user.role === "manager") {
      // 👨‍💼 Manager → all leads
      result = await pool.query(
        "SELECT * FROM leads ORDER BY created_at DESC"
      );
    } else {
      // 👨‍💻 Employee → only own
      result = await pool.query(
        "SELECT * FROM leads WHERE assigned_to=$1 ORDER BY created_at DESC",
        [req.user.id]
      );
    }

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

/* ===============================
   DASHBOARD STATS (TODAY/YESTERDAY)
================================ */
router.get("/stats", auth, async (req, res) => {
  try {

    let condition =
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
    console.error(err);
    res.status(500).json({ error: "Failed stats" });
  }
});

/* ===============================
   UPDATE STATUS + REMARK
================================ */
router.put("/update/:id", auth, async (req, res) => {
  try {

    const { status, remark } = req.body;

    // update lead
    const lead = await pool.query(
      "UPDATE leads SET status=$1 WHERE id=$2 RETURNING *",
      [status, req.params.id]
    );

    // save remark
    if (remark) {
      await pool.query(
        `INSERT INTO notes (lead_id, employee_id, note)
         VALUES ($1,$2,$3)`,
        [req.params.id, req.user.id, remark]
      );
    }

    res.json(lead.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

/* ===============================
   GET NOTES (REMARK HISTORY)
================================ */
router.get("/notes/:id", auth, async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT n.*, u.name
       FROM notes n
       JOIN users u ON u.id = n.employee_id
       WHERE lead_id=$1
       ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed notes" });
  }
});

/* ===============================
   FOLLOWUP ADD
================================ */
router.post("/followup", auth, async (req, res) => {
  try {

    const { lead_id, followup_date, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO followups (lead_id,followup_date,notes)
       VALUES ($1,$2,$3) RETURNING *`,
      [lead_id, followup_date, notes]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Followup failed" });
  }
});

/* ===============================
   TODAY FOLLOWUPS
================================ */
router.get("/followups/today", auth, async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT f.*, l.name, l.phone
       FROM followups f
       JOIN leads l ON l.id=f.lead_id
       WHERE followup_date=CURRENT_DATE
       AND l.assigned_to=$1`,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed followups" });
  }
});

module.exports = router;