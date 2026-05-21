const mongoose = require("mongoose");

async function connectDatabase() {
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    tls: true,
  });

  console.log("MongoDB conectado");
}

module.exports = connectDatabase;