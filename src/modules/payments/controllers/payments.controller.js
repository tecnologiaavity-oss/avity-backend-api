const Payment = require("../../../models/Payment");

async function createPixPayment(req, res) {
  try {
    const { amount, requestId, appointmentId } = req.body;

    const payment = await Payment.create({
      userId: req.user.id,
      requestId: requestId || null,
      appointmentId: appointmentId || null,
      amount,
      method: "pix",
      status: "pending",
      provider: "mock_pix",
      providerPaymentId: `PIX-${Date.now()}`,
      pixQrCode:
        "00020126580014BR.GOV.BCB.PIX0136123456789015204000053039865406159.905802BR5925AVITY SAUDE INTELIGENTE6009SAO PAULO62070503***6304ABCD",
      pixCopyPaste:
        "00020126580014BR.GOV.BCB.PIX0136123456789015204000053039865406159.905802BR5925AVITY SAUDE INTELIGENTE6009SAO PAULO62070503***6304ABCD",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    return res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao criar pagamento PIX.",
      error: error.message,
    });
  }
}

async function createCardPayment(req, res) {
  try {
    const { amount, requestId, appointmentId, cardData } = req.body;

    const payment = await Payment.create({
      userId: req.user.id,
      requestId: requestId || null,
      appointmentId: appointmentId || null,
      amount,
      method: "card",
      status: "paid",
      provider: "mock_card",
      providerPaymentId: `CARD-${Date.now()}`,
      paidAt: new Date(),
    });

    return res.json({
      success: true,
      message: "Pagamento com cartão aprovado.",
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao processar cartão.",
      error: error.message,
    });
  }
}

async function getPaymentStatus(req, res) {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Pagamento não encontrado.",
      });
    }

    return res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao consultar pagamento.",
    });
  }
}

async function mockApprovePayment(req, res) {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Pagamento não encontrado.",
      });
    }

    payment.status = "paid";
    payment.paidAt = new Date();

    await payment.save();

    return res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao aprovar pagamento.",
    });
  }
}

async function createCoparticipationPayment(req, res) {
  try {
    const { amount, requestId, appointmentId, companyId, employeeCpf } = req.body;

    if (!companyId || !employeeCpf) {
      return res.status(400).json({
        success: false,
        message: "Informe ID da empresa e CPF do colaborador.",
      });
    }

    const payment = await Payment.create({
      userId: req.user.id,
      requestId: requestId || null,
      appointmentId: appointmentId || null,
      amount,
      method: "card",
      status: "paid",
      provider: "corporate_coparticipation",
      providerPaymentId: `COPART-${companyId}-${Date.now()}`,
      paidAt: new Date(),
    });

    return res.json({
      success: true,
      message: "Coparticipação autorizada.",
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao autorizar coparticipação.",
      error: error.message,
    });
  }
}

module.exports = {
  createPixPayment,
  createCardPayment,
  createCoparticipationPayment,
  getPaymentStatus,
  mockApprovePayment,
};