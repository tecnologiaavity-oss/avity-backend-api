const cron = require("node-cron");
const Request = require("../models/Request");
const Notification = require("../models/Notification");

function startCronJobs() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const expiredRequests = await Request.find({
        status: "waiting_partner_response",
        expiresAt: { $lt: new Date() },
      });

      for (const request of expiredRequests) {
        request.status = "expired";
        await request.save();

        await Notification.create({
          userId: request.patientId,
          audience: "patient",
          type: "request_expired",
          title: "Solicitação expirada",
          message: "Sua solicitação expirou sem resposta.",
          metadata: {
            requestId: request._id,
          },
        });
      }

      if (expiredRequests.length > 0) {
        console.log(
          `[CRON] ${expiredRequests.length} solicitações expiradas`
        );
      }
    } catch (error) {
      console.error("[CRON ERROR]", error.message);
    }
  });

  console.log("Cron jobs iniciados");
}

module.exports = startCronJobs;