const AuditLog = require("../../../models/AuditLog");

async function listAuditLogs(req, res) {
  try {
    const {
      actorUserId,
      actorRole,
      action,
      module,
      targetType,
      targetId,
      severity,
      startDate,
      endDate,
      limit = 100,
    } = req.query;

    const filter = {};

    if (actorUserId) filter.actorUserId = actorUserId;
    if (actorRole) filter.actorRole = actorRole;
    if (action) filter.action = action;
    if (module) filter.module = module;
    if (targetType) filter.targetType = targetType;
    if (targetId) filter.targetId = targetId;
    if (severity) filter.severity = severity;

    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao listar logs de auditoria.",
      error: error.message,
    });
  }
}

async function getAuditLogById(req, res) {
  try {
    const log = await AuditLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Log de auditoria não encontrado.",
      });
    }

    return res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar log de auditoria.",
      error: error.message,
    });
  }
}

module.exports = {
  listAuditLogs,
  getAuditLogById,
};