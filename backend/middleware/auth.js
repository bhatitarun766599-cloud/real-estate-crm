const jwt = require("jsonwebtoken");

/* ===============================
   AUTH MIDDLEWARE
================================ */

module.exports = function (req, res, next) {

  try {

    const authHeader = req.headers.authorization;

    // ❌ No token
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Format: Bearer TOKEN
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    // 🔑 Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "crm_secret"
    );

    // ✅ Attach user to request
    req.user = decoded;

    next();

  } catch (err) {

    console.error("Auth Middleware Error:", err);

    return res.status(401).json({
      error: "Invalid or expired token"
    });

  }

};