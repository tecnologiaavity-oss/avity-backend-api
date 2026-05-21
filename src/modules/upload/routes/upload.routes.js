const express = require("express");
const multer = require("multer");
const path = require("path");
const { authMiddleware } = require("../../../middlewares/authMiddleware");

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },

  filename(req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(
      null,
      uniqueName + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
  ];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Tipo de arquivo não permitido."));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post(
  "/",
  authMiddleware,
  upload.single("file"),
  (req, res) => {
    return res.status(201).json({
      success: true,
      message: "Upload realizado com sucesso.",
      data: {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
      },
    });
  }
);

module.exports = router;