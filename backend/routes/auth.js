const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../db");

const router = express.Router();

/* ===============================
   LOGIN (EMPLOYEE + MANAGER)
================================ */

router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    // 🔒 Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // 🔍 Find user
    const user = await pool.query(
      "SELECT id, name, email, password, role FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const dbUser = user.rows[0];

    // 🔑 Password check
    const validPassword = await bcrypt.compare(password, dbUser.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // 🎟️ Token generate
    const token = jwt.sign(
      {
        id: dbUser.id,
        role: dbUser.role
      },
      process.env.JWT_SECRET || "crm_secret",
      { expiresIn: "7d" }
    );

    // ✅ Response
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role
      }
    });

  } catch (err) {

    console.error("Login Error:", err);

    res.status(500).json({
      error: "Internal server error"
    });

  }

});


/* ===============================
   GET CURRENT USER
================================ */
router.get("/me", async (req, res) => {
  try {

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "crm_secret"
    );

    const user = await pool.query(
      "SELECT id,name,email,role FROM users WHERE id=$1",
      [decoded.id]
    );

    res.json(user.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;