const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    module: "Health",
    routes: [
      "Avity Negocia",
      "Essencial",
      "Premium",
      "Especialista",
      "Urgência",
      "APH futuro",
    ],
  });
});

module.exports = router;