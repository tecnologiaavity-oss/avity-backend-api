let ioInstance = null;

function initSocket(server) {
  const { Server } = require("socket.io");

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket conectado:", socket.id);

    socket.on("join", ({ userId, partnerId }) => {
      if (userId) socket.join(`user:${userId}`);
      if (partnerId) socket.join(`partner:${partnerId}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket desconectado:", socket.id);
    });
  });

  ioInstance = io;
  return io;
}

function getSocket() {
  return ioInstance;
}

module.exports = {
  initSocket,
  getSocket,
};