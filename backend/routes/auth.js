const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../db");

const router = express.Router();


// LOGIN
router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const dbUser = user.rows[0];

    const validPassword = await bcrypt.compare(
      password,
      dbUser.password
    );

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: dbUser.id, role: dbUser.role },
      process.env.JWT_SECRET || "crm_secret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token: token,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        role: dbUser.role
      }
    });

  } catch (err) {

    console.error(err.message);
    res.status(500).send("Server Error");

  }

});

module.exports = router;