const express = require("express");

const { searchOffers } = require("../controllers/search.controller");

const router = express.Router();

router.get("/offers", searchOffers);

module.exports = router;