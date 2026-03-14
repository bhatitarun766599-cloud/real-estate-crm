const express = require("express");
const pool = require("../db");

const router = express.Router();


// ADD LEAD
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
      source,
      assigned_to
    } = req.body;

    const newLead = await pool.query(
      `INSERT INTO leads
      (name,phone,email,city,property_interest,budget,notes,source,assigned_to)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [name,phone,email,city,property_interest,budget,notes,source,assigned_to]
    );

    res.json(newLead.rows[0]);

  } catch (err) {

    console.error(err.message);
    res.status(500).json({ error: "Failed to add lead" });

  }
});


// GET ALL LEADS
router.get("/all", async (req, res) => {
  try {

    const leads = await pool.query(
      `SELECT l.*, e.name AS employee_name
       FROM leads l
       LEFT JOIN employees e ON e.id = l.assigned_to
       ORDER BY l.created_at DESC`
    );

    res.json(leads.rows);

  } catch (err) {

    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch leads" });

  }
});


// UPDATE LEAD STATUS
router.put("/status/:id", async (req, res) => {
  try {

    const { status } = req.body;

    const lead = await pool.query(
      "UPDATE leads SET status=$1 WHERE id=$2 RETURNING *",
      [status, req.params.id]
    );

    res.json(lead.rows[0]);

  } catch (err) {

    console.error(err.message);
    res.status(500).json({ error: "Failed to update status" });

  }
});


// ASSIGN LEAD TO EMPLOYEE
router.put("/assign/:id", async (req, res) => {
  try {

    const { employee_id } = req.body;

    const result = await pool.query(
      "UPDATE leads SET assigned_to=$1 WHERE id=$2 RETURNING *",
      [employee_id, req.params.id]
    );

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err.message);
    res.status(500).json({ error: "Failed to assign lead" });

  }
});


// LEADS BY EMPLOYEE
router.get("/employee/:id", async (req, res) => {
  try {

    const leads = await pool.query(
      "SELECT * FROM leads WHERE assigned_to=$1",
      [req.params.id]
    );

    res.json(leads.rows);

  } catch (err) {

    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch employee leads" });

  }
});


// ADD FOLLOWUP
router.post("/followup", async (req, res) => {
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


// TODAY FOLLOWUPS
router.get("/today-followups", async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT f.*, l.name, l.phone
       FROM followups f
       JOIN leads l ON l.id = f.lead_id
       WHERE followup_date = CURRENT_DATE`
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch today followups" });

  }
});


// MISSED FOLLOWUPS
router.get("/missed-followups", async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT f.*, l.name, l.phone
       FROM followups f
       JOIN leads l ON l.id = f.lead_id
       WHERE followup_date < CURRENT_DATE`
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch missed followups" });

  }
});


// UPCOMING FOLLOWUPS
router.get("/upcoming-followups", async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT f.*, l.name, l.phone
       FROM followups f
       JOIN leads l ON l.id = f.lead_id
       WHERE followup_date > CURRENT_DATE`
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch upcoming followups" });

  }
});


// ANALYTICS
router.get("/analytics", async (req, res) => {
  try {

    const total = await pool.query("SELECT COUNT(*)::int FROM leads");

    const today = await pool.query(
      "SELECT COUNT(*)::int FROM leads WHERE DATE(created_at)=CURRENT_DATE"
    );

    const interested = await pool.query(
      "SELECT COUNT(*)::int FROM leads WHERE status='Interested'"
    );

    const closed = await pool.query(
      "SELECT COUNT(*)::int FROM leads WHERE status='Deal Closed'"
    );

    const lost = await pool.query(
      "SELECT COUNT(*)::int FROM leads WHERE status='Lost Lead'"
    );

    res.json({
      total: total.rows[0].count,
      today: today.rows[0].count,
      interested: interested.rows[0].count,
      closed: closed.rows[0].count,
      lost: lost.rows[0].count
    });

  } catch (err) {

    console.error(err.message);
    res.status(500).json({ error: "Failed to load analytics" });

  }
});


module.exports = router;