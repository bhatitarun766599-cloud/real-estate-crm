const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();


/* ===============================
   ROUND ROBIN EMPLOYEE ASSIGNMENT
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

    const employee = await getNextEmployee();

    const newLead = await pool.query(
      `INSERT INTO leads
      (name,phone,email,city,property_interest,budget,notes,source,assigned_to)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [name,phone,email,city,property_interest,budget,notes,source,employee]
    );

    res.json(newLead.rows[0]);

  } catch (err) {

    console.error(err.message);
    res.status(500).json({ error: "Failed to add lead" });

  }
});


/* ===============================
   GET MY LEADS (EMPLOYEE)
================================ */
router.get("/my", auth, async (req, res) => {
  try {

    const leads = await pool.query(
      "SELECT * FROM leads WHERE assigned_to=$1 ORDER BY created_at DESC",
      [req.user.id]
    );

    res.json(leads.rows);

  } catch (err) {

    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch leads" });

  }
});


/* ===============================
   UPDATE STATUS
================================ */
router.put("/status/:id", auth, async (req, res) => {
  try {

    const { status } = req.body;

    const lead = await pool.query(
      "UPDATE leads SET status=$1 WHERE id=$2 AND assigned_to=$3 RETURNING *",
      [status, req.params.id, req.user.id]
    );

    res.json(lead.rows[0]);

  } catch (err) {

    console.error(err.message);
    res.status(500).json({ error: "Failed to update status" });

  }
});


/* ===============================
   ADD NOTE
================================ */
router.post("/note/:id", auth, async (req, res) => {
  try {

    const { note } = req.body;

    const result = await pool.query(
      `INSERT INTO notes (lead_id, employee_id, note)
       VALUES ($1,$2,$3) RETURNING *`,
      [req.params.id, req.user.id, note]
    );

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err.message);
    res.status(500).json({ error: "Failed to add note" });

  }
});


/* ===============================
   GET NOTES
================================ */
router.get("/notes/:id", auth, async (req, res) => {
  try {

    const result = await pool.query(
      "SELECT * FROM notes WHERE lead_id=$1 ORDER BY created_at DESC",
      [req.params.id]
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch notes" });

  }
});


/* ===============================
   ADD FOLLOWUP
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

    console.error(err.message);
    res.status(500).json({ error: "Failed to add followup" });

  }
});


/* ===============================
   TODAY FOLLOWUPS (EMPLOYEE)
================================ */
router.get("/today-followups", auth, async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT f.*, l.name, l.phone
       FROM followups f
       JOIN leads l ON l.id = f.lead_id
       WHERE followup_date = CURRENT_DATE AND l.assigned_to=$1`,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch today followups" });

  }
});


module.exports = router;