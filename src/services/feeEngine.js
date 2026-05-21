function calculatePlatformFee({
  category,
  avityMode,
  finalValue,
  urgent = false,
  partnerType,
}) {
  let feePercent = 0;

  /*
  |--------------------------------------------------------------------------
  | HEALTHCARE
  |--------------------------------------------------------------------------
  */

  if (category === "health") {
    switch (avityMode) {
      case "negocia":
        feePercent = 0.20;
        break;

      case "essencial":
        feePercent = 0.12;
        break;

      case "premium":
        feePercent = 0.18;
        break;

      case "especialista":
        feePercent = 0.22;
        break;

      default:
        feePercent = 0.15;
    }

    if (urgent) {
      feePercent += 0.08;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LABS
  |--------------------------------------------------------------------------
  */

  if (category === "labs") {
    feePercent = urgent ? 0.22 : 0.15;
  }

  /*
  |--------------------------------------------------------------------------
  | FITNESS / GYMS
  |--------------------------------------------------------------------------
  */

  if (category === "fitness") {
    feePercent = 0.10;
  }

  /*
  |--------------------------------------------------------------------------
  | PET
  |--------------------------------------------------------------------------
  */

  if (category === "pet") {
    feePercent = urgent ? 0.25 : 0.18;
  }

  /*
  |--------------------------------------------------------------------------
  | PARTNER ADJUSTMENTS
  |--------------------------------------------------------------------------
  */

  if (partnerType === "hospital") {
    feePercent += 0.03;
  }

  if (partnerType === "specialist_clinic") {
    feePercent += 0.02;
  }

  /*
  |--------------------------------------------------------------------------
  | SAFETY LIMITS
  |--------------------------------------------------------------------------
  */

  if (feePercent < 0.08) {
    feePercent = 0.08;
  }

  if (feePercent > 0.35) {
    feePercent = 0.35;
  }

  const platformFee = Number((finalValue * feePercent).toFixed(2));
  const partnerNetValue = Number((finalValue - platformFee).toFixed(2));

  return {
    feePercent,
    platformFee,
    partnerNetValue,
  };
}

module.exports = {
  calculatePlatformFee,
};