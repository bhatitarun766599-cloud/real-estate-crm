const express = require("express");
const pool = require("../db");

const router = express.Router();

router.post("/add", async (req,res)=>{

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

});

router.get("/all", async(req,res)=>{
 const leads = await pool.query("SELECT * FROM leads");
 res.json(leads.rows);
});

module.exports = router;
router.put("/status/:id", async (req,res)=>{

 const {status} = req.body;

 const lead = await pool.query(
  "UPDATE leads SET status=$1 WHERE id=$2 RETURNING *",
  [status, req.params.id]
 );

 res.json(lead.rows[0]);

});
router.post("/followup", async (req,res)=>{

 const {lead_id,followup_date,notes} = req.body;

 const result = await pool.query(
  "INSERT INTO followups (lead_id,followup_date,notes) VALUES ($1,$2,$3) RETURNING *",
  [lead_id,followup_date,notes]
 );

 res.json(result.rows[0]);

});
router.get("/today-followups", async(req,res)=>{

 const result = await pool.query(
  "SELECT * FROM followups WHERE followup_date = CURRENT_DATE"
 );

 res.json(result.rows);

});
router.get("/analytics", async(req,res)=>{

 const total = await pool.query("SELECT COUNT(*) FROM leads");

 const today = await pool.query(
  "SELECT COUNT(*) FROM leads WHERE DATE(created_at)=CURRENT_DATE"
 );

 const interested = await pool.query(
  "SELECT COUNT(*) FROM leads WHERE status='Interested'"
 );

 const closed = await pool.query(
  "SELECT COUNT(*) FROM leads WHERE status='Deal Closed'"
 );

 const lost = await pool.query(
  "SELECT COUNT(*) FROM leads WHERE status='Lost Lead'"
 );

 res.json({

  total: total.rows[0].count,
  today: today.rows[0].count,
  interested: interested.rows[0].count,
  closed: closed.rows[0].count,
  lost: lost.rows[0].count

 });

});
router.put("/assign/:id", async(req,res)=>{

 const {employee_id} = req.body;

 const result = await pool.query(
  "UPDATE leads SET assigned_to=$1 WHERE id=$2 RETURNING *",
  [employee_id,req.params.id]
 );

 res.json(result.rows[0]);

});
router.get("/employee/:id", async(req,res)=>{

 const leads = await pool.query(
  "SELECT * FROM leads WHERE assigned_to=$1",
  [req.params.id]
 );

 res.json(leads.rows);

});
router.get("/missed-followups", async(req,res)=>{

 const result = await pool.query(
  "SELECT * FROM followups WHERE followup_date < CURRENT_DATE"
 )

 res.json(result.rows)

})


router.get("/upcoming-followups", async(req,res)=>{

 const result = await pool.query(
  "SELECT * FROM followups WHERE followup_date > CURRENT_DATE"
 )

 res.json(result.rows)

})