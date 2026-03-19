const pool = require("./db");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1ipAcjDCL30_V2d2DW8rY7pSg_NM-l_M34njCW15NfEk/export?format=csv"; // 👈 replace

async function syncLeads() {
  try {
    const res = await fetch(SHEET_URL);
    const text = await res.text();

    const rows = text.split("\n").slice(1); // skip header

    for (let row of rows) {
      const cols = row.split(",");

      const name = cols[14];   // full_name column
      const phone = cols[15];  // phone column

      if (!phone) continue;

      // duplicate check
      const exists = await pool.query(
        "SELECT id FROM leads WHERE phone=$1",
        [phone]
      );

      if (exists.rows.length > 0) continue;

      // assign employee (simple)
      const employee = 1;

      await pool.query(
        `INSERT INTO leads (name, phone, source, assigned_to)
         VALUES ($1,$2,$3,$4)`,
        [name, phone, "facebook_ads", employee]
      );

      console.log("✅ Lead Imported:", name);
    }

  } catch (err) {
    console.error("❌ Sheet Sync Error:", err.message);
  }
}

module.exports = syncLeads;