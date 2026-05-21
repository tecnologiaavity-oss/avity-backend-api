const Partner = require("../../../models/Partner");
const PartnerDocument = require("../../../models/PartnerDocument");
const AuditLog = require("../../../models/AuditLog");

async function createDocument(req, res) {
  try {
    const document = await PartnerDocument.create(req.body);

    await AuditLog.create({
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || "system",
      actorName: req.user?.name || "Sistema",
      action: "create_partner_document",
      module: "partners",
      targetType: "partner",
      targetId: document.partnerId,
      description: `Documento ${document.title} enviado.`,
      severity: "info",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(201).json({
      success: true,
      message: "Documento cadastrado com sucesso.",
      data: document,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao cadastrar documento.",
      error: error.message,
    });
  }
}

async function listDocuments(req, res) {
  try {
    const { partnerId, status, documentType } = req.query;

    const filter = {};
    if (partnerId) filter.partnerId = partnerId;
    if (status) filter.status = status;
    if (documentType) filter.documentType = documentType;

    const documents = await PartnerDocument.find(filter)
      .populate("partnerId", "companyName tradeName partnerType status documentNumber")
      .populate("reviewedBy", "name email role")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao listar documentos.",
      error: error.message,
    });
  }
}

async function approveDocument(req, res) {
  try {
    const document = await PartnerDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Documento não encontrado.",
      });
    }

    document.status = "approved";
    document.reviewedBy = req.user?.id || null;
    document.reviewedAt = new Date();
    document.rejectionReason = null;

    await document.save();

    await AuditLog.create({
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || "system",
      actorName: req.user?.name || "Sistema",
      action: "approve_partner_document",
      module: "partners",
      targetType: "partner",
      targetId: document.partnerId,
      description: `Documento ${document.title} aprovado.`,
      severity: "critical",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Documento aprovado.",
      data: document,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao aprovar documento.",
      error: error.message,
    });
  }
}

async function rejectDocument(req, res) {
  try {
    const { rejectionReason } = req.body;

    const document = await PartnerDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Documento não encontrado.",
      });
    }

    document.status = "rejected";
    document.rejectionReason = rejectionReason || "Documento recusado.";
    document.reviewedBy = req.user?.id || null;
    document.reviewedAt = new Date();

    await document.save();

    await AuditLog.create({
      actorUserId: req.user?.id || null,
      actorRole: req.user?.role || "system",
      actorName: req.user?.name || "Sistema",
      action: "reject_partner_document",
      module: "partners",
      targetType: "partner",
      targetId: document.partnerId,
      description: `Documento ${document.title} recusado: ${document.rejectionReason}`,
      severity: "warning",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Documento recusado.",
      data: document,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao recusar documento.",
      error: error.message,
    });
  }
}

async function reviewPartnerDocuments(req, res) {
  try {
    const { partnerId } = req.params;

    const partner = await Partner.findById(partnerId);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Parceiro não encontrado.",
      });
    }

    const documents = await PartnerDocument.find({ partnerId });

    const requiredDocsByType = {
      clinic: ["cnpj_card", "social_contract", "business_license", "health_license", "bank_proof"],
      laboratory: ["cnpj_card", "social_contract", "business_license", "health_license", "bank_proof"],
      gym: ["cnpj_card", "social_contract", "business_license", "bank_proof"],
      wellness: ["cnpj_card", "social_contract", "bank_proof"],
      aph: ["cnpj_card", "social_contract", "business_license", "health_license", "insurance_policy", "bank_proof"],
      pet: ["cnpj_card", "social_contract", "business_license", "bank_proof"],
    };

    const required = requiredDocsByType[partner.partnerType] || [];

    const approvedTypes = documents
      .filter((doc) => doc.status === "approved")
      .map((doc) => doc.documentType);

    const missingDocuments = required.filter(
      (docType) => !approvedTypes.includes(docType)
    );

    let partnerStatus = partner.status;

    if (missingDocuments.length > 0) {
      partner.status = "pending_documents";
      partnerStatus = "pending_documents";
    } else {
      partner.status = "approved";
      partnerStatus = "approved";
    }

    await partner.save();

    return res.json({
      success: true,
      message:
        missingDocuments.length > 0
          ? "Parceiro ainda possui documentos pendentes."
          : "Documentação completa. Parceiro aprovado.",
      data: {
        partner,
        requiredDocuments: required,
        missingDocuments,
        documents,
        partnerStatus,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao revisar documentação do parceiro.",
      error: error.message,
    });
  }
}

module.exports = {
  createDocument,
  listDocuments,
  approveDocument,
  rejectDocument,
  reviewPartnerDocuments,
};