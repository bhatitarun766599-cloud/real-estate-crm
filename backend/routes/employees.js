const express = require("express");
const pool = require("../db");

const router = express.Router();

router.post("/add", async(req,res)=>{

 const {name,email,password} = req.body;

 const result = await pool.query(
  "INSERT INTO employees (name,email,password) VALUES ($1,$2,$3) RETURNING *",
  [name,email,password]
 );

 res.json(result.rows[0]);

});

router.get("/all", async(req,res)=>{

 const employees = await pool.query("SELECT * FROM employees");

 res.json(employees.rows);

});

module.exports = router;
router.post("/login", async(req,res)=>{

 const {email,password} = req.body

 const result = await pool.query(
  "SELECT * FROM employees WHERE email=$1 AND password=$2",
  [email,password]
 )

 if(result.rows.length===0){

  return res.status(401).json({
   message:"Invalid login"
  })

 }

 res.json(result.rows[0])

})