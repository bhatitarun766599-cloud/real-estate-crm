const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/* 🔥 IMPORTANT: yahan apna CSV link paste karo */
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1ipAcjDCL30_V2d2DW8rY7pSg_NM-l_M34njCW15NfEk/export?format=csv";

/* ===============================
   ROUND ROBIN EMPLOYEE
================================ */

async function getNextEmployee(){

 const employees = await pool.query(
  "SELECT id FROM employees WHERE status='active' ORDER BY id"
 );

 if(employees.rows.length === 0){
  return null;
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
   SYNC FUNCTION
================================ */

async function syncLeads(){

 try{

  const res = await fetch(SHEET_URL);
  const text = await res.text();

  const rows = text.split("\n").slice(1);

  for(const row of rows){

    const cols = row.split(",");

    const name = cols[0];
    const phone = cols[1];

    if(!phone) continue;

    // duplicate check
    const exists = await pool.query(
      "SELECT id FROM leads WHERE phone=$1",
      [phone]
    );

    if(exists.rows.length > 0) continue;

    const employee = await getNextEmployee();

    await pool.query(
      "INSERT INTO leads (name,phone,source,assigned_to) VALUES ($1,$2,$3,$4)",
      [name,phone,"facebook_sheet",employee]
    );

    console.log("✅ Lead imported:", phone);

  }

 }catch(err){
  console.error("❌ Sheet sync error:", err);
 }

}

module.exports = syncLeads;