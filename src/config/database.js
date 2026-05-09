const mongoose = require("mongoose");

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB conectado");
  } catch (error) {
    console.error("Erro MongoDB:", error.message);
    process.exit(1);
  }
}

module.exports = connectDatabase;