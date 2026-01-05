function parseBP(bp) {
  if (!bp || typeof bp !== "string" || !bp.includes("/")) return null;
  const [systolicStr, diastolicStr] = bp.split("/");
  const systolic = parseInt(systolicStr, 10);
  const diastolic = parseInt(diastolicStr, 10);
  if (isNaN(systolic) || isNaN(diastolic)) return null;
  return { systolic, diastolic };
}

function calculateBPRisk(bp) {
  const parsed = parseBP(bp);
  if (!parsed) return { score: 0, valid: false };
  const { systolic, diastolic } = parsed;

  let score = 0;
  if (systolic < 120 && diastolic < 80) score = 1;
  else if (systolic >= 120 && systolic <= 129 && diastolic < 80) score = 2;
  else if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) score = 3;
  else if (systolic >= 140 || diastolic >= 90) score = 4;

  return { score, valid: true };
}

function calculateTempRisk(temp) {
  const t = parseFloat(temp);
  if (isNaN(t)) return { score: 0, valid: false };
  if (t <= 99.5) return { score: 0, valid: true };
  if (t >= 99.6 && t <= 100.9) return { score: 1, valid: true };
  if (t >= 101) return { score: 2, valid: true };
  return { score: 0, valid: true };
}

function calculateAgeRisk(age) {
  const a = parseInt(age, 10);
  if (isNaN(a)) return { score: 0, valid: false };
  if (a < 40) return { score: 1, valid: true };
  if (a <= 65) return { score: 1, valid: true };
  return { score: 2, valid: true };
}


module.exports = { parseBP, calculateBPRisk, calculateTempRisk, calculateAgeRisk };
