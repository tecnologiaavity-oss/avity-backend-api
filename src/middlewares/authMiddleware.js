const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token não informado.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Usuário inválido ou inativo.",
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      partnerId: user.partnerId ? user.partnerId.toString() : null,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token inválido.",
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado.",
      });
    }

    next();
  };
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado.",
      });
    }

    if (
      req.user.role === "super_admin" ||
      req.user.permissions.includes("all") ||
      req.user.permissions.includes(permission)
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Permissão insuficiente.",
    });
  };
}

function requirePartnerAccess(paramName = "partnerId") {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado.",
      });
    }

    if (
      ["super_admin", "admin", "operations_admin", "finance_admin"].includes(
        req.user.role
      )
    ) {
      return next();
    }

    const requestedPartnerId =
      req.params[paramName] ||
      req.body.partnerId ||
      req.query.partnerId;

    if (!requestedPartnerId) {
      return res.status(400).json({
        success: false,
        message: "partnerId não informado.",
      });
    }

    if (
      ["partner_owner", "partner_staff"].includes(req.user.role) &&
      req.user.partnerId === requestedPartnerId
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Você não tem acesso a este parceiro.",
    });
  };
}

function requireSelfOrAdmin(paramName = "userId") {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado.",
      });
    }

    if (
      ["super_admin", "admin", "operations_admin", "support"].includes(
        req.user.role
      )
    ) {
      return next();
    }

    const requestedUserId =
      req.params[paramName] || req.body[paramName] || req.query[paramName];

    if (!requestedUserId) {
      return res.status(400).json({
        success: false,
        message: "userId não informado.",
      });
    }

    if (req.user.id === requestedUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Você não tem acesso a este usuário.",
    });
  };
}

module.exports = {
  authMiddleware,
  requireRole,
  requirePermission,
  requirePartnerAccess,
  requireSelfOrAdmin,
};