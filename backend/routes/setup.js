const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");

const router = express.Router();

router.get("/create-users", async (req, res) => {
  try {

    const password = await bcrypt.hash("123456", 10);

    // Manager
    await pool.query(
      `INSERT INTO users (name,email,password,role)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (email) DO NOTHING`,
      ["Manager","admin@gmail.com",password,"manager"]
    );

    // Employees
    const employees = [
      ["Employee 1","emp1@gmail.com"],
      ["Employee 2","emp2@gmail.com"],
      ["Employee 3","emp3@gmail.com"],
      ["Employee 4","emp4@gmail.com"],
    ];

    for(let emp of employees){
      await pool.query(
        `INSERT INTO users (name,email,password,role)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (email) DO NOTHING`,
        [emp[0], emp[1], password, "employee"]
      );
    }

    res.send("✅ Users Created Successfully");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating users");
  }
});

module.exports = router;