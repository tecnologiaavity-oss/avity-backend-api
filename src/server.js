const dns = require("dns");
const http = require("http");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const app = require("./app");
const connectDatabase = require("./config/database");
const startCronJobs = require("./jobs/cron");
const { initSocket } = require("./socket/socket");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDatabase();

    const server = http.createServer(app);

    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Avity API rodando na porta ${PORT}`);
      console.log("Socket.io iniciado");
      startCronJobs();
    });
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error.message);
    process.exit(1);
  }
}

startServer();