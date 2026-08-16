import axios from "axios";

const BASE_URL = "http://localhost:3000";

/* ================= AUTH APIS ================= */
export const registerAPI = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const loginAPI = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

/* ================= COMMON AUTH HEADER ================= */

const getAuthHeaders = () => {
  const token = localStorage.getItem("TOKEN");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

/* ================= ADMIN APIs ================= */

export const addEmergencyAPI = async (data) => {
  const res = await fetch(`${BASE_URL}/admin/add-emergency`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
};

export const getAllBeneficiariesAPI = async () => {
  const res = await fetch(`${BASE_URL}/admin/beneficiaries`, {
    headers: getAuthHeaders(),
  });

  return res.json();
};

export const verifyBeneficiaryAPI = async (id) => {
  const res = await fetch(`${BASE_URL}/admin/verify-beneficiary`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ id }),
  });

  return res.json();
};

export const distributeAidAPI = async (data) => {
  const res = await fetch(`${BASE_URL}/admin/distribute-aid`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
};

export const startAidCycleAPI = async (data) => {
  const res = await fetch(`${BASE_URL}/admin/aid-cycle/start`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const closeAidCycleAPI = async (data) => {
  const res = await fetch(`${BASE_URL}/admin/aid-cycle/close`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getAidCyclesAPI = async (emergencyId) => {
  const res = await fetch(`${BASE_URL}/admin/aid-cycle/${emergencyId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getAidCycleStatusAPI = async (emergencyId) => {
  const res = await fetch(`${BASE_URL}/admin/aid-cycle/status/${emergencyId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getDistributionSummaryAPI = async (emergencyId) => {
  const res = await fetch(`${BASE_URL}/admin/distribution-summary/${emergencyId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getAidAllocationsAPI = async (emergencyId) => {
  const query = emergencyId ? `?emergencyId=${encodeURIComponent(emergencyId)}` : "";
  const res = await fetch(`${BASE_URL}/admin/aid-allocations${query}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getCycleSummaryAPI = async (emergencyId, cycleId) => {
  const res = await fetch(`${BASE_URL}/admin/cycle-summary/${emergencyId}/${cycleId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getReconciliationAPI = async (emergencyId) => {
  const res = await fetch(`${BASE_URL}/admin/reconciliation/${emergencyId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const uploadProofAPI = async (data) => {
  const token = localStorage.getItem("TOKEN");
  const res = await axios.post(`${BASE_URL}/admin/upload-proof`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

/* ✅ MISSING FUNCTION — THIS WAS CAUSING YOUR ERROR */
export const getAllDonationsAPI = async () => {
  const res = await fetch(`${BASE_URL}/donor/transactions`, {
    headers: getAuthHeaders(),
  });

  return res.json();
};

/* ================= DONOR APIs ================= */

export const getEmergenciesAPI = async () => {
  const res = await fetch(`${BASE_URL}/donor/emergencies`);
  return res.json();
};

export const createDonationAPI = async (data) => {
  const res = await fetch(`${BASE_URL}/donor/create-donation`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
};

export const confirmPaymentAPI = async (data) => {
  const res = await fetch(`${BASE_URL}/donor/confirm-payment`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
};

export const getTransactionsAPI = async () => {
  const res = await fetch(`${BASE_URL}/donor/transactions`, {
    headers: getAuthHeaders(),
  });

  return res.json();
};

export const getDonationTraceAPI = async (donationId) => {
  const res = await fetch(`${BASE_URL}/donor/trace/${donationId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

/* ================= BENEFICIARY APIs ================= */

export const submitBeneficiaryAPI = async (data) => {
  const res = await fetch(`${BASE_URL}/beneficiary/register`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
};

export const registerBeneficiaryAPI = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/register-beneficiary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getBeneficiaryStatusAPI = async () => {
  const res = await fetch(`${BASE_URL}/beneficiary/status/me`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getAidAPI = async () => {
  const res = await fetch(`${BASE_URL}/beneficiary/aid/me`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getAidStatusAPI = async () => {
  const res = await fetch(`${BASE_URL}/beneficiary/aid-status`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};
