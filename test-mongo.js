const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

require("dotenv").config();
const mongoose = require("mongoose");

async function test() {
  try {
    console.log("Testando Mongo...");

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
    });

    console.log("✅ CONECTOU");
    process.exit(0);

  } catch (err) {
    console.dir(err, { depth: null });
    process.exit(1);
  }
}

test();