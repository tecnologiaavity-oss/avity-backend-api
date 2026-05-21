const express = require("express");

const {
  getWallets,
  getWalletByPartner,
  updateBankAccount,
  listTransactions,
  requestWithdraw,
} = require("../controllers/wallet.controller");

const {
  authMiddleware,
  requireRole,
  requirePartnerAccess,
} = require("../../../middlewares/authMiddleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  requireRole("super_admin", "admin", "finance_admin"),
  getWallets
);

router.get(
  "/transactions",
  authMiddleware,
  requireRole("super_admin", "admin", "finance_admin"),
  listTransactions
);

router.get(
  "/partner/:partnerId",
  authMiddleware,
  requirePartnerAccess("partnerId"),
  getWalletByPartner
);

router.patch(
  "/partner/:partnerId/bank-account",
  authMiddleware,
  requirePartnerAccess("partnerId"),
  updateBankAccount
);

router.post(
  "/withdraw",
  authMiddleware,
  requireRole("super_admin", "admin", "finance_admin", "partner_owner"),
  requestWithdraw
);

module.exports = router;