const express = require("express");

const {
  registerAdmin,
  login,
  me,
} = require("../controllers/auth.controller");

const {
  authMiddleware,
  requireRole,
} = require("../../../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/register-admin",
  authMiddleware,
  requireRole("super_admin"),
  registerAdmin
);

router.post("/login", login);

router.get("/me", authMiddleware, me);

module.exports = router;