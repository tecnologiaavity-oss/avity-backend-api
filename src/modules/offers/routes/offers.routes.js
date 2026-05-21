const express = require("express");

const {
  createOffer,
  listOffers,
  getOfferById,
  updateOffer,
  toggleOfferStatus,
} = require("../controllers/offers.controller");

const {
  authMiddleware,
  requireRole,
} = require("../../../middlewares/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Público
|--------------------------------------------------------------------------
*/

router.get("/", listOffers);
router.get("/:id", getOfferById);

/*
|--------------------------------------------------------------------------
| Privado
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authMiddleware,
  requireRole(
    "super_admin",
    "admin",
    "operations_admin",
    "partner_owner",
    "partner_staff"
  ),
  createOffer
);

router.patch(
  "/:id",
  authMiddleware,
  requireRole(
    "super_admin",
    "admin",
    "operations_admin",
    "partner_owner",
    "partner_staff"
  ),
  updateOffer
);

router.patch(
  "/:id/toggle",
  authMiddleware,
  requireRole(
    "super_admin",
    "admin",
    "operations_admin",
    "partner_owner"
  ),
  toggleOfferStatus
);

module.exports = router;