const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const mongoose = require("mongoose");
const Partner = require("./src/models/Partner");

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const partners = await Partner.find({
      "location.lat": { $exists: true },
      "location.lng": { $exists: true },
    });

    let updated = 0;

    for (const partner of partners) {
      partner.location.geo = {
        type: "Point",
        coordinates: [partner.location.lng, partner.location.lat],
      };

      await partner.save();
      updated++;
    }

    console.log(`Migração concluída. ${updated} parceiro(s) atualizados.`);
    process.exit(0);
  } catch (error) {
    console.error("Erro:", error.message);
    process.exit(1);
  }
}

run();