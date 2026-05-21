const express = require("express");

const {
  createRequest,
  listRequests,
  getRequestById,
  acceptRequest,
  counterOfferRequest,
  rejectRequest,
} = require("../controllers/requests.controller");

const {
  authMiddleware,
  requireRole,
} = require("../../../middlewares/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Paciente cria solicitação
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authMiddleware,
  requireRole("patient", "super_admin", "admin"),
  createRequest
);

/*
|--------------------------------------------------------------------------
| Consulta
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  authMiddleware,
  requireRole(
    "super_admin",
    "admin",
    "operations_admin",
    "support",
    "partner_owner",
    "partner_staff",
    "patient"
  ),
  listRequests
);

router.get(
  "/:id",
  authMiddleware,
  requireRole(
    "super_admin",
    "admin",
    "operations_admin",
    "support",
    "partner_owner",
    "partner_staff",
    "patient"
  ),
  getRequestById
);

/*
|--------------------------------------------------------------------------
| Negociação
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/accept",
  authMiddleware,
  requireRole(
    "super_admin",
    "admin",
    "operations_admin",
    "partner_owner",
    "partner_staff"
  ),
  acceptRequest
);

router.patch(
  "/:id/counter-offer",
  authMiddleware,
  requireRole(
    "super_admin",
    "admin",
    "operations_admin",
    "partner_owner",
    "partner_staff"
  ),
  counterOfferRequest
);

router.patch(
  "/:id/reject",
  authMiddleware,
  requireRole(
    "super_admin",
    "admin",
    "operations_admin",
    "partner_owner",
    "partner_staff",
    "patient"
  ),
  rejectRequest
);

module.exports = router;