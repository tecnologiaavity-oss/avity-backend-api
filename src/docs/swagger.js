const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Avity API",
      version: "1.0.0",
      description: "Documentação oficial da Avity API",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/modules/**/*.js"],
};

module.exports = swaggerJsdoc(options);