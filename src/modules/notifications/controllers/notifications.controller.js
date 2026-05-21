const Notification = require("../../../models/Notification");

async function listNotifications(req, res) {
  try {
    const { userId, partnerId, audience, read } = req.query;

    const filter = {};

    if (userId) filter.userId = userId;
    if (partnerId) filter.partnerId = partnerId;
    if (audience) filter.audience = audience;
    if (read !== undefined) filter.read = read === "true";

    const notifications = await Notification.find(filter).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao listar notificações.",
      error: error.message,
    });
  }
}

async function markAsRead(req, res) {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notificação não encontrada.",
      });
    }

    return res.json({
      success: true,
      message: "Notificação marcada como lida.",
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao atualizar notificação.",
      error: error.message,
    });
  }
}

module.exports = {
  listNotifications,
  markAsRead,
};