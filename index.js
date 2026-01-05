const { calculateBPRisk, calculateTempRisk, calculateAgeRisk } = require("./risk.js");

require('dotenv').config();

const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPatients(page = 1, limit = 20, retries = 3) {
  const url = `${BASE_URL}/patients?page=${page}&limit=${limit}`;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { "x-api-key": API_KEY } });
      if (res.status === 429) { await sleep(500); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await sleep(500);
    }
  }
}

async function getAllPatients() {
  let page = 1
  const allPatients = []
  let morePages = true
  while (morePages) {
    const data = await fetchPatients(page);
    allPatients = allPatients.concat(data.data);
    morePages = data.pagination.hasNext;
    page++;
  }
  return allPatients;
}

async function computeAlerts() {
  const patients = await getAllPatients();
  const highRiskPatients = []
  const feverPatients = []
  const dataQualityIssues = []

  for (const p of patients) {
    const bpRisk = calculateBPRisk(p.blood_pressure);
    const tempRisk = calculateTempRisk(p.temperature);
    const ageRisk = calculateAgeRisk(p.age);

    const totalScore = bpRisk.score + tempRisk.score + ageRisk.score;

    if (!bpRisk.valid || !tempRisk.valid || !ageRisk.valid) {
      dataQualityIssues.push(p.patient_id);
    }

    if (totalScore >= 4) highRiskPatients.push(p.patient_id);
    if (parseFloat(p.temperature) >= 99.6) feverPatients.push(p.patient_id);
  }

  return { highRiskPatients, feverPatients, dataQualityIssues };
}

async function submitAssessment(results) {
  const res = await fetch(`${BASE_URL}/submit-assessment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY
    },
    body: JSON.stringify(results)
  });
  const data = await res.json();
  console.log("Assessment Results:", data);
  return data;
}

(async () => {
  try {
    const { highRiskPatients, feverPatients, dataQualityIssues } = await computeAlerts();
    console.log("High Risk:", highRiskPatients);
    console.log("Fever Patients:", feverPatients);
    console.log("Data Quality Issues:", dataQualityIssues);

    await submitAssessment({
      high_risk_patients: highRiskPatients,
      fever_patients: feverPatients,
      data_quality_issues: dataQualityIssues
    });
  } catch (err) {
    console.error("Error:", err);
  }
})();
