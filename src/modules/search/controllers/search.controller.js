const Partner = require("../../../models/Partner");
const Offer = require("../../../models/Offer");

function toNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

async function searchOffers(req, res) {
  try {
    const {
      lat,
      lng,
      radiusKm = 10,
      category,
      partnerType,
      avityMode,
      offerType,
      specialty,
      examName,
      gymPlan,
      urgent,
      limit = 30,
    } = req.query;

    const latitude = toNumber(lat);
    const longitude = toNumber(lng);
    const radius = toNumber(radiusKm, 10);
    const resultLimit = toNumber(limit, 30);

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude e longitude são obrigatórias.",
      });
    }

    const partnerFilter = {
      status: "approved",
      isOnline: true,
      "location.geo": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: radius * 1000,
        },
      },
    };

    if (partnerType) {
      partnerFilter.partnerType = partnerType;
    }

    if (urgent === "true") {
      partnerFilter.urgencyEnabled = true;
    }

    if (gymPlan) {
      partnerFilter.acceptedGymPlans = gymPlan;
    }

    const partners = await Partner.find(partnerFilter).limit(resultLimit);

    const partnerIds = partners.map((partner) => partner._id);

    const offerFilter = {
      partnerId: { $in: partnerIds },
      isActive: true,
      visibility: "public",
    };

    if (category) offerFilter.category = category;
    if (avityMode) offerFilter.avityMode = avityMode;
    if (offerType) offerFilter.offerType = offerType;
    if (specialty) offerFilter.specialty = new RegExp(specialty, "i");
    if (examName) offerFilter.examName = new RegExp(examName, "i");
    if (urgent === "true") offerFilter.urgentAvailable = true;
    if (gymPlan) offerFilter.acceptedGymPlans = gymPlan;

    const offers = await Offer.find(offerFilter)
      .populate(
        "partnerId",
        "companyName tradeName partnerType rating totalReviews address location isOnline urgencyEnabled acceptedGymPlans"
      )
      .sort({ basePrice: 1 })
      .limit(resultLimit);

    return res.json({
      success: true,
      count: offers.length,
      query: {
        lat: latitude,
        lng: longitude,
        radiusKm: radius,
        category,
        partnerType,
        avityMode,
        offerType,
        specialty,
        examName,
        gymPlan,
        urgent,
      },
      data: offers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar ofertas próximas.",
      error: error.message,
    });
  }
}

module.exports = {
  searchOffers,
};