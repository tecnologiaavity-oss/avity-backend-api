const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    module: "Labs",
    routes: [
      "Exames",
      "Coleta domiciliar",
      "Urgência",
      "Resultados",
    ],
  });
});

module.exports = router;