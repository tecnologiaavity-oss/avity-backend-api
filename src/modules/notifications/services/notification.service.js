const Notification = require("../../../models/Notification");
const { getSocket } = require("../../../socket/socket");

async function createNotification({
  userId = null,
  partnerId = null,
  audience,
  type,
  title,
  message,
  metadata = {},
}) {
  const notification = await Notification.create({
    userId,
    partnerId,
    audience,
    type,
    title,
    message,
    metadata,
  });

  const io = getSocket();

  if (io) {
    if (userId) {
      io.to(`user:${userId}`).emit("notification:new", notification);
    }

    if (partnerId) {
      io.to(`partner:${partnerId}`).emit("notification:new", notification);
    }

    io.emit("notification:created", notification);
  }

  return notification;
}

module.exports = {
  createNotification,
};