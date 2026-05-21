const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const mongoose = require("mongoose");
const Wallet = require("./src/models/Wallet");

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const exists = await Wallet.findOne({
      ownerType: "platform",
    });

    if (exists) {
      console.log("Carteira da Avity já existe:");
      console.log(exists);
      process.exit(0);
    }

    const wallet = await Wallet.create({
      ownerType: "platform",
      ownerId: new mongoose.Types.ObjectId(),
      balance: 0,
      pendingBalance: 0,
      blockedBalance: 0,
      currency: "BRL",
      status: "active",
    });

    console.log("Carteira da Avity criada com sucesso:");
    console.log(wallet);

    process.exit(0);
  } catch (error) {
    console.error("Erro:", error.message);
    process.exit(1);
  }
}

run();