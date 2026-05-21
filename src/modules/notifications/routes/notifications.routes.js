const express = require("express");

const {
  listNotifications,
  markAsRead,
} = require("../controllers/notifications.controller");

const { authMiddleware } = require("../../../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, listNotifications);
router.patch("/:id/read", authMiddleware, markAsRead);

module.exports = router;