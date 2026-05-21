const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const xss = require("xss-clean");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");

const authRoutes = require("./modules/auth/routes/auth.routes");
const partnerRoutes = require("./modules/partners/routes/partners.routes");
const offerRoutes = require("./modules/offers/routes/offers.routes");
const requestRoutes = require("./modules/requests/routes/requests.routes");
const appointmentRoutes = require("./modules/appointments/routes/appointments.routes");
const walletRoutes = require("./modules/wallet/routes/wallet.routes");
const payoutRoutes = require("./modules/payouts/routes/payouts.routes");
const searchRoutes = require("./modules/search/routes/search.routes");
const notificationRoutes = require("./modules/notifications/routes/notifications.routes");
const documentRoutes = require("./modules/documents/routes/documents.routes");
const uploadRoutes = require("./modules/upload/routes/upload.routes");

const healthRoutes = require("./modules/health/health.routes");
const fitnessRoutes = require("./modules/fitness/fitness.routes");
const labsRoutes = require("./modules/labs/labs.routes");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000", "http://localhost:5173"];

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origem não permitida pelo CORS."));
    },
    credentials: true,
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Muitas requisições. Tente novamente em alguns minutos.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Muitas tentativas de login. Tente novamente em alguns minutos.",
  },
});

app.use("/api/auth/login", loginLimiter);
app.use("/api", apiLimiter);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(mongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: ["specialties", "category", "status"],
  })
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Avity API online",
    version: "1.0.0",
    status: "ok",
    timestamp: new Date(),
  });
});

if (process.env.NODE_ENV !== "production") {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use("/api/auth", authRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/payouts", payoutRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/upload", uploadRoutes);

app.use("/api/health", healthRoutes);
app.use("/api/fitness", fitnessRoutes);
app.use("/api/labs", labsRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Rota não encontrada.",
    path: req.originalUrl,
  });
});

app.use((error, req, res, next) => {
  console.error("Erro interno:", error);

  res.status(500).json({
    success: false,
    message: "Erro interno do servidor.",
  });
});

module.exports = app;