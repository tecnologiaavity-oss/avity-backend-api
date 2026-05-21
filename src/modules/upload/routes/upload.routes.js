const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authMiddleware } = require("../../../middlewares/authMiddleware");

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeTypes = ["application/pdf", "image/png", "image/jpeg"];

const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg"];

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Tipo de arquivo não permitido."));
  }

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error("Extensão de arquivo não permitida."));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

router.post("/", authMiddleware, (req, res) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Erro ao enviar arquivo.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Arquivo não enviado.",
      });
    }

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
  });
});

module.exports = router;