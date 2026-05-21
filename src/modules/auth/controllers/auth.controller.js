const jwt = require("jsonwebtoken");
const User = require("../../../models/User");
const AuditLog = require("../../../models/AuditLog");

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      permissions: user.permissions,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

async function registerAdmin(req, res) {
  try {
    const { name, email, password, role, permissions } = req.body;

    const allowedRoles = [
      "admin",
      "operations_admin",
      "finance_admin",
      "support",
      "partner_owner",
      "partner_staff",
      "patient",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role inválida.",
      });
    }

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Usuário já cadastrado.",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      permissions: permissions || [],
      status: "active",
    });

    await AuditLog.create({
      actorUserId: req.user.id,
      actorRole: req.user.role,
      actorName: req.user.name,
      action: "register_admin",
      module: "auth",
      targetType: "user",
      targetId: user._id,
      description: `Usuário administrativo ${user.name} criado.`,
      severity: "security",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(201).json({
      success: true,
      message: "Usuário criado com sucesso.",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao criar usuário.",
      error: error.message,
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      await AuditLog.create({
        actorRole: "unknown",
        actorName: email || "desconhecido",
        action: "login_failed",
        module: "auth",
        targetType: "user",
        description: "Tentativa de login com e-mail inexistente.",
        severity: "security",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return res.status(401).json({
        success: false,
        message: "Credenciais inválidas.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Usuário bloqueado, suspenso ou pendente.",
      });
    }

    const passwordMatch = await user.comparePassword(password);

    if (!passwordMatch) {
      await AuditLog.create({
        actorUserId: user._id,
        actorRole: user.role,
        actorName: user.name,
        action: "login_failed",
        module: "auth",
        targetType: "user",
        targetId: user._id,
        description: `Senha inválida para ${user.email}.`,
        severity: "security",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return res.status(401).json({
        success: false,
        message: "Credenciais inválidas.",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);

    await AuditLog.create({
      actorUserId: user._id,
      actorRole: user.role,
      actorName: user.name,
      action: "login",
      module: "auth",
      targetType: "user",
      targetId: user._id,
      description: `Login realizado por ${user.name}.`,
      severity: "security",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Login realizado com sucesso.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao realizar login.",
      error: error.message,
    });
  }
}

async function me(req, res) {
  return res.json({
    success: true,
    user: req.user,
  });
}

module.exports = {
  registerAdmin,
  login,
  me,
};