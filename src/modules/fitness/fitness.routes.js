const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    module: "Fitness",
    routes: [
      "Planos de academia",
      "Créditos",
      "Check-in",
      "Bem-estar",
    ],
  });
});

module.exports = router;