// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { 
  login, 
  logout, 
  profile, 
  changePassword,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  updateProfile
} = require("../controllers/authController");

router.post("/login", login);
router.post("/logout", logout);
router.get("/profile", profile);
router.put("/profile", updateProfile);
router.post("/change-password", changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-reset-token/:token", verifyResetToken);

module.exports = router;