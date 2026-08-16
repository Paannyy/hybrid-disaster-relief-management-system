import { useState, useEffect } from "react";
import {
  addEmergencyAPI,
  getAllDonationsAPI,
  distributeAidAPI,
  startAidCycleAPI,
  closeAidCycleAPI,
  getAidCyclesAPI,
  getAidCycleStatusAPI,
  getDistributionSummaryAPI,
  getAidAllocationsAPI,
  getCycleSummaryAPI,
  getReconciliationAPI,
  uploadProofAPI,
  getAllBeneficiariesAPI,
  verifyBeneficiaryAPI,
  getEmergenciesAPI,
} from "../api/api";

import AdminNavbar from "../components/AdminNavbar";
import Card from "../components/Card";
import "../pages/pages.css";

export default function AdminDashboard() {
  const [view, setView] = useState("home");

  const [emergencyTitle, setEmergencyTitle] = useState("");
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);

  const [aidEmergencyId, setAidEmergencyId] = useState("");
  const [aidCycle, setAidCycle] = useState("");
  const [manualHouseholdId, setManualHouseholdId] = useState("");
  const [selectedDonationId, setSelectedDonationId] = useState("");
  const [distributionAmount, setDistributionAmount] = useState("");
  const [cycleList, setCycleList] = useState([]);
  const [emergencyOptions, setEmergencyOptions] = useState([]);
  const [cycleStatus, setCycleStatus] = useState({ status: "NONE", cycleId: "" });
  const [cycleFeedback, setCycleFeedback] = useState(null);
  const [distributionFeedback, setDistributionFeedback] = useState(null);
  const [distributionSummary, setDistributionSummary] = useState(null);
  const [donationPoolSummary, setDonationPoolSummary] = useState(null);
  const [aidAllocations, setAidAllocations] = useState([]);
  const [cycleSummary, setCycleSummary] = useState(null);
  const [reconciliation, setReconciliation] = useState(null);

  const [proofEmergencyId, setProofEmergencyId] = useState("");
  const [proofRows, setProofRows] = useState([]);
  const [proofDescriptionByAid, setProofDescriptionByAid] = useState({});
  const [proofFileByAid, setProofFileByAid] = useState({});

  const [donations, setDonations] = useState([]);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (view === "home" || view === "donations" || view === "aid") loadDonations();
    if (view === "home" || view === "beneficiary") loadBeneficiaries();
  }, [view]);

  useEffect(() => {
    if (view === "home" || view === "aid" || view === "proof") {
      loadEmergencies();
    }
  }, [view]);

  useEffect(() => {
    if (view !== "proof") return;
    if (!proofEmergencyId) {
      setProofRows([]);
      return;
    }

    loadProofRows(proofEmergencyId);
  }, [view, proofEmergencyId]);

  useEffect(() => {
    if (view !== "aid" && view !== "home") return;
    if (!aidEmergencyId) {
      setCycleStatus({ status: "NONE", cycleId: "" });
      setAidCycle("");
      setCycleList([]);
      setDonationPoolSummary(null);
      setCycleSummary(null);
      setReconciliation(null);
      return;
    }

    loadCycleStatus(aidEmergencyId);
    loadCycles(aidEmergencyId);
    loadDistributionSummary(aidEmergencyId);
    loadAidAllocations(aidEmergencyId);
    loadReconciliation(aidEmergencyId);
  }, [view, aidEmergencyId]);

  useEffect(() => {
    if (view !== "aid" && view !== "home") return;
    if (cycleStatus.status !== "ACTIVE" || !aidEmergencyId || !cycleStatus.cycleId) {
      setCycleSummary(null);
      return;
    }
    loadCycleSummary(aidEmergencyId, cycleStatus.cycleId);
  }, [view, aidEmergencyId, cycleStatus]);

  const loadDonations = async () => {
    try {
      const data = await getAllDonationsAPI();
      setDonations(Array.isArray(data) ? data : []);
    } catch {
      setDonations([]);
    }
  };

  const loadBeneficiaries = async () => {
    try {
      setLoadingBeneficiaries(true);
      const data = await getAllBeneficiariesAPI();
      setBeneficiaries(Array.isArray(data) ? data : []);
    } catch {
      setBeneficiaries([]);
    } finally {
      setLoadingBeneficiaries(false);
    }
  };

  const loadEmergencies = async () => {
    try {
      const data = await getEmergenciesAPI();
      setEmergencyOptions(Array.isArray(data) ? data : []);
    } catch {
      setEmergencyOptions([]);
    }
  };

  const handleCreateEmergency = async () => {
    if (!emergencyTitle || !severity || !description) {
      setNotice({ type: "error", message: "Fill all emergency fields" });
      return;
    }

    try {
      await addEmergencyAPI({ title: emergencyTitle, severity, description });
      await loadEmergencies();
      setNotice({ type: "success", message: "Emergency added successfully" });
      setEmergencyTitle("");
      setSeverity("");
      setDescription("");
    } catch {
      setNotice({ type: "error", message: "Emergency creation failed" });
    }
  };

  const loadCycles = async (emergencyIdParam) => {
    const targetEmergencyId = emergencyIdParam || aidEmergencyId;
    if (!targetEmergencyId) {
      setCycleList([]);
      return;
    }
    try {
      const data = await getAidCyclesAPI(targetEmergencyId);
      setCycleList(Array.isArray(data) ? data : []);
    } catch {
      setCycleList([]);
    }
  };

  const loadCycleStatus = async (emergencyIdParam) => {
    const targetEmergencyId = emergencyIdParam || aidEmergencyId;
    if (!targetEmergencyId) {
      setCycleStatus({ status: "NONE", cycleId: "" });
      setAidCycle("");
      return;
    }

    try {
      const data = await getAidCycleStatusAPI(targetEmergencyId);
      if (data?.status === "ACTIVE") {
        setCycleStatus({ status: "ACTIVE", cycleId: data.cycleId || "" });
        setAidCycle(data.cycleId || "");
      } else {
        setCycleStatus({ status: "NONE", cycleId: "" });
        setAidCycle("");
      }
    } catch {
      setCycleStatus({ status: "NONE", cycleId: "" });
      setAidCycle("");
    }
  };

  const loadDistributionSummary = async (emergencyIdParam) => {
    const targetEmergencyId = emergencyIdParam || aidEmergencyId;
    if (!targetEmergencyId) {
      setDonationPoolSummary(null);
      return;
    }
    try {
      const data = await getDistributionSummaryAPI(targetEmergencyId);
      setDonationPoolSummary(data?.error ? null : data);
    } catch {
      setDonationPoolSummary(null);
    }
  };

  const loadAidAllocations = async (emergencyIdParam) => {
    const targetEmergencyId = emergencyIdParam || aidEmergencyId;
    try {
      const data = await getAidAllocationsAPI(targetEmergencyId);
      setAidAllocations(Array.isArray(data) ? data : []);
    } catch {
      setAidAllocations([]);
    }
  };

  const loadCycleSummary = async (emergencyIdParam, cycleIdParam) => {
    const targetEmergencyId = emergencyIdParam || aidEmergencyId;
    const targetCycleId = cycleIdParam || cycleStatus.cycleId;
    if (!targetEmergencyId || !targetCycleId) {
      setCycleSummary(null);
      return;
    }
    try {
      const data = await getCycleSummaryAPI(targetEmergencyId, targetCycleId);
      setCycleSummary(data?.error ? null : data);
    } catch {
      setCycleSummary(null);
    }
  };

  const loadReconciliation = async (emergencyIdParam) => {
    const targetEmergencyId = emergencyIdParam || aidEmergencyId;
    if (!targetEmergencyId) {
      setReconciliation(null);
      return;
    }
    try {
      const data = await getReconciliationAPI(targetEmergencyId);
      setReconciliation(data?.error ? null : data);
    } catch {
      setReconciliation(null);
    }
  };

  const loadProofRows = async (emergencyIdParam) => {
    const targetEmergencyId = emergencyIdParam || proofEmergencyId;
    if (!targetEmergencyId) {
      setProofRows([]);
      return;
    }

    try {
      const data = await getAidAllocationsAPI(targetEmergencyId);
      const rows = Array.isArray(data)
        ? data.filter((aid) => aid.aidStatus === "ALLOCATED")
        : [];
      setProofRows(rows);
    } catch {
      setProofRows([]);
    }
  };

  const handleFileChange = (aidId, file) => {
    setProofFileByAid((prev) => ({
      ...prev,
      [aidId]: file || null,
    }));
  };

  const handleUpload = async (aid) => {
    const selectedFile = proofFileByAid[aid._id];
    const description = (proofDescriptionByAid[aid._id] || "").trim();

    if (!selectedFile || !description) {
      setNotice({ type: "error", message: "Select a proof file and enter description" });
      return;
    }

    const formData = new FormData();
    formData.append("proof", selectedFile);
    formData.append("aidId", aid._id);
    formData.append("description", description);
    formData.append("proofData", `${aid._id}:${selectedFile.name}:${description}`);

    try {
      const result = await uploadProofAPI(formData);
      if (result?.error) {
        setNotice({ type: "error", message: result.error });
        return;
      }

      setNotice({ type: "success", message: "Proof uploaded successfully" });
      setProofDescriptionByAid((prev) => ({ ...prev, [aid._id]: "" }));
      setProofFileByAid((prev) => ({ ...prev, [aid._id]: null }));
      await loadProofRows(proofEmergencyId);
      await loadAidAllocations(proofEmergencyId);
      if (aidEmergencyId === proofEmergencyId) {
        await loadCycleSummary(proofEmergencyId, aid.aidCycle);
        await loadReconciliation(proofEmergencyId);
      }
    } catch {
      setNotice({ type: "error", message: "Proof upload failed" });
    }
  };

  const totalSuccessAmount = Number(donationPoolSummary?.totalSuccessAmount ?? 0);
  const totalAllocatedAmount = Number(donationPoolSummary?.totalAllocatedAmount ?? 0);
  const normalizedDistributionAmount = Number(distributionAmount);
  const utilizationPercent = totalSuccessAmount > 0
    ? Math.min(100, (totalAllocatedAmount / totalSuccessAmount) * 100)
    : 0;
  const formatDonationOptionDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-IN");
  };
  const renderStatusBadge = (value) => {
    const normalizedStatus = (value || "").toUpperCase();
    const statusMap = {
      PENDING: { className: "status-pending", label: "🟡 Pending" },
      ALLOCATED: { className: "status-allocated", label: "🔵 Allocated" },
      DELIVERED: { className: "status-delivered", label: "🟢 Delivered" },
    };
    const config = statusMap[normalizedStatus];
    return config ? <span className={config.className}>{config.label}</span> : value || "-";
  };
  const pendingBeneficiaries = beneficiaries.filter((b) => b.status === "PENDING");
  const approvedBeneficiaries = beneficiaries.filter((b) => b.status === "APPROVED" && b.householdId);
  const selectedEmergencyDonations = donations.filter(
    (donation) =>
      String(donation.emergencyId) === aidEmergencyId &&
      donation.paymentStatus === "SUCCESS"
  );
  const allocatedByDonationId = aidAllocations.reduce((accumulator, aid) => {
    if (!aid.donationId) return accumulator;
    const key = String(aid.donationId);
    const currentAmount = Number(aid.allocatedAmount ?? aid.amountAllocated ?? 0);
    accumulator[key] = (accumulator[key] || 0) + currentAmount;
    return accumulator;
  }, {});
  const pendingProofRowsForEmergency = aidAllocations.filter((aid) => aid.aidStatus === "ALLOCATED");
  const pendingProofCount = pendingProofRowsForEmergency.length;
  const eligibleDonationsForDistribution = selectedEmergencyDonations.filter((donation) => {
    const allocatedAmount = Number(allocatedByDonationId[String(donation._id)] || 0);
    return Number(donation.amount || 0) - allocatedAmount > 0;
  });
  const hasNoEligibleDonations = (donationPoolSummary?.eligibleDonationCount ?? 0) === 0;

  return (
    <>
      <AdminNavbar setView={setView} />
      {notice && (
        <div
          className="note-text"
          style={{
            margin: "10px 16px 0",
            padding: "8px 10px",
            borderRadius: "6px",
            background: notice.type === "error" ? "#fef2f2" : "#f0fdf4",
            color: notice.type === "error" ? "#b91c1c" : "#166534",
            fontWeight: 600,
          }}
        >
          {notice.message}
        </div>
      )}

      {view === "home" && (
        <>
          <Card title="Emergency Management">
            <div className="note-text" style={{ fontWeight: 700, marginBottom: "8px" }}>
              Create emergency and manage the active aid cycle for the selected disaster.
            </div>
            <input
              placeholder="Title"
              value={emergencyTitle}
              onChange={(e) => setEmergencyTitle(e.target.value)}
            />
            <input
              placeholder="Severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            />
            <textarea
              placeholder="Description"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              className="btn-blue"
              onClick={handleCreateEmergency}
            >
              Add Emergency
            </button>

            <div style={{ marginTop: "16px", borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
              <select
                value={aidEmergencyId}
                onChange={(e) => {
                  setAidEmergencyId(e.target.value);
                  setProofEmergencyId(e.target.value);
                  setSelectedDonationId("");
                  setManualHouseholdId("");
                  setDistributionAmount("");
                  setCycleFeedback(null);
                  setDistributionFeedback(null);
                  setNotice(null);
                }}
              >
                <option value="">Select Emergency</option>
                {emergencyOptions.map((emergency) => (
                  <option key={emergency._id} value={emergency._id}>
                    {emergency.title} ({emergency._id})
                  </option>
                ))}
              </select>

              {aidEmergencyId && cycleStatus.status === "ACTIVE" && (
                <div className="note-text" style={{ marginTop: "8px", color: "#166534", fontWeight: 700 }}>
                  {"\uD83D\uDFE2"} Active Cycle: {cycleStatus.cycleId}
                </div>
              )}
              {aidEmergencyId && cycleStatus.status === "NONE" && (
                <div className="note-text" style={{ marginTop: "8px", color: "#b45309", fontWeight: 700 }}>
                  {"\uD83D\uDD34"} No Active Cycle
                </div>
              )}

              {aidEmergencyId && cycleStatus.status === "NONE" && (
                <>
                  <input
                    placeholder="Aid Cycle (e.g. CYCLE-2026-01)"
                    value={aidCycle}
                    onChange={(e) => setAidCycle(e.target.value)}
                  />
                  <button
                    className="btn-green"
                    onClick={async () => {
                      if (!aidEmergencyId || !aidCycle) {
                        setCycleFeedback({ type: "warning", message: "Enter emergency and cycle ID to start a cycle." });
                        return;
                      }
                      try {
                        const result = await startAidCycleAPI({ emergencyId: aidEmergencyId, cycleId: aidCycle });
                        if (result?.error) {
                          setCycleFeedback({ type: "error", message: result.error || "Failed to start cycle" });
                          return;
                        }
                        setCycleFeedback({ type: "success", message: result?.message || "Cycle started successfully" });
                        await loadCycleStatus(aidEmergencyId);
                        await loadCycles(aidEmergencyId);
                        await loadDistributionSummary(aidEmergencyId);
                        await loadAidAllocations(aidEmergencyId);
                        await loadReconciliation(aidEmergencyId);
                      } catch {
                        setCycleFeedback({ type: "error", message: "Failed to start cycle" });
                      }
                    }}
                  >
                    Start New Cycle
                  </button>
                </>
              )}

              {aidEmergencyId && cycleStatus.status === "ACTIVE" && (
                <button
                  className="btn-blue"
                  onClick={async () => {
                    try {
                      const result = await closeAidCycleAPI({ emergencyId: aidEmergencyId });
                      if (result?.error) {
                        setCycleFeedback({ type: "error", message: result.error });
                        return;
                      }
                      setCycleFeedback({ type: "success", message: result?.message || "Cycle closed successfully" });
                      await loadCycleStatus(aidEmergencyId);
                      await loadCycles(aidEmergencyId);
                      await loadDistributionSummary(aidEmergencyId);
                      await loadAidAllocations(aidEmergencyId);
                      await loadReconciliation(aidEmergencyId);
                    } catch {
                      setCycleFeedback({ type: "error", message: "Failed to close cycle" });
                    }
                  }}
                >
                  Close Cycle
                </button>
              )}

              {cycleFeedback && (
                <div
                  className="note-text"
                  style={{
                    marginTop: "8px",
                    color: cycleFeedback.type === "error" ? "#b91c1c" : cycleFeedback.type === "warning" ? "#b45309" : "#166534",
                    fontWeight: 700,
                  }}
                >
                  {cycleFeedback.message}
                </div>
              )}

              {cycleList.length > 0 && (
                <div className="note-text" style={{ marginTop: "8px" }}>
                  {cycleList.map((cycle) => (
                    <div key={cycle._id}>{cycle.cycleId} - {cycle.status}</div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card title="Beneficiary Verification">
            {loadingBeneficiaries ? (
              <p>Loading beneficiaries...</p>
            ) : pendingBeneficiaries.length === 0 ? (
              <p className="note-text">No pending beneficiaries awaiting verification.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Unique ID</th>
                    <th>Family Members</th>
                    <th>Status</th>
                    <th>Verify Beneficiary</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBeneficiaries.map((beneficiary) => (
                    <tr key={beneficiary._id}>
                      <td>{beneficiary.name}</td>
                      <td>{beneficiary.uniqueId}</td>
                      <td>{beneficiary.familyMembers}</td>
                      <td>{renderStatusBadge(beneficiary.status)}</td>
                      <td>
                        <button
                          className="btn-green"
                          onClick={async () => {
                            try {
                              const result = await verifyBeneficiaryAPI(beneficiary._id);
                              if (result?.error) {
                                setNotice({ type: "error", message: result.error });
                                return;
                              }
                              if (result?.message && result.message !== "Beneficiary verified") {
                                setNotice({ type: "error", message: result.message });
                                return;
                              }
                              setNotice({
                                type: "success",
                                message: `Beneficiary verified with household ID ${result?.beneficiary?.householdId || ""}`.trim(),
                              });
                              await loadBeneficiaries();
                            } catch {
                              setNotice({ type: "error", message: "Verification failed" });
                            }
                          }}
                        >
                          Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Donation Pool">
            {!aidEmergencyId ? (
              <p className="note-text">Select an emergency in Emergency Management to inspect the donation pool.</p>
            ) : selectedEmergencyDonations.length === 0 ? (
              <p className="note-text">No SUCCESS donations found for this emergency.</p>
            ) : (
              <>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Donor Name</th>
                      <th>Donation Amount</th>
                      <th>Allocated Amount</th>
                      <th>Remaining Funds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmergencyDonations.map((donation) => {
                      const allocatedAmount = Number(allocatedByDonationId[String(donation._id)] || 0);
                      const remainingFunds = Math.max(0, Number(donation.amount || 0) - allocatedAmount);
                      return (
                        <tr key={donation._id}>
                          <td>{donation.donorName || donation.donorId?.name || "Unknown Donor"}</td>
                          <td>Rs. {donation.amount}</td>
                          <td>Rs. {allocatedAmount}</td>
                          <td>Rs. {remainingFunds}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {donationPoolSummary && (
                  <div style={{ marginTop: "12px", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#f9fafb" }}>
                    <div style={{ fontWeight: 700, marginBottom: "8px" }}>{"\uD83D\uDCB0"} Fund Utilization</div>
                    <div className="note-text">Total SUCCESS Donations: {donationPoolSummary.totalSuccessDonations ?? 0}</div>
                    <div className="note-text">Total SUCCESS Amount: Rs. {donationPoolSummary.totalSuccessAmount ?? 0}</div>
                    <div className="note-text">Allocated Amount: Rs. {donationPoolSummary.totalAllocatedAmount ?? 0}</div>
                    <div className="note-text">Remaining Pool: Rs. {donationPoolSummary.eligibleDonationAmount ?? 0}</div>
                    {totalSuccessAmount > 0 && (
                      <div style={{ marginTop: "10px" }}>
                        <div style={{ width: "100%", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden", height: "12px" }}>
                          <div style={{ width: `${utilizationPercent.toFixed(2)}%`, background: "#16a34a", height: "100%", transition: "width 400ms ease" }} />
                        </div>
                        <div className="note-text" style={{ marginTop: "6px", fontWeight: 700 }}>
                          {utilizationPercent.toFixed(0)}% utilized
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </Card>

          <Card title="Aid Distribution">
            {!aidEmergencyId ? (
              <p className="note-text">Select an emergency and active cycle before distributing aid.</p>
            ) : (
              <>
                {cycleStatus.status === "ACTIVE" ? (
                  <div className="note-text" style={{ marginBottom: "10px", color: "#166534", fontWeight: 700 }}>
                    {"\uD83D\uDFE2"} Distributing under cycle {cycleStatus.cycleId}
                  </div>
                ) : (
                  <div className="note-text" style={{ marginBottom: "10px", color: "#b45309", fontWeight: 700 }}>
                    {"\uD83D\uDD34"} Start a cycle before distributing aid.
                  </div>
                )}

                <select
                  value={selectedDonationId}
                  onChange={(e) => setSelectedDonationId(e.target.value)}
                >
                  <option value="">Select Donation</option>
                  {eligibleDonationsForDistribution.map((donation) => {
                    const allocatedAmount = Number(allocatedByDonationId[String(donation._id)] || 0);
                    const remainingFunds = Math.max(0, Number(donation.amount || 0) - allocatedAmount);
                    return (
                      <option key={donation._id} value={donation._id}>
                        {`${donation.donorName || "Unknown Donor"} • ₹${donation.amount} • Remaining ₹${remainingFunds} • ${formatDonationOptionDate(donation.createdAt)}`}
                      </option>
                    );
                  })}
                </select>

                <select
                  value={manualHouseholdId}
                  onChange={(e) => setManualHouseholdId(e.target.value)}
                >
                  <option value="">Select Household</option>
                  {approvedBeneficiaries.map((beneficiary) => (
                    <option key={beneficiary._id} value={beneficiary.householdId}>
                      {beneficiary.householdId} • {beneficiary.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Allocation Amount"
                  value={distributionAmount}
                  onChange={(e) => setDistributionAmount(e.target.value)}
                />

                {eligibleDonationsForDistribution.length === 0 && (
                  <div className="note-text" style={{ marginTop: "8px", color: "#b45309", fontWeight: 700 }}>
                    No donations with remaining funds are available for this emergency.
                  </div>
                )}

                <button
                  className="btn-blue"
                  disabled={
                    !aidEmergencyId ||
                    cycleStatus.status !== "ACTIVE" ||
                    hasNoEligibleDonations ||
                    !selectedDonationId ||
                    !manualHouseholdId.trim() ||
                    !Number.isFinite(normalizedDistributionAmount) ||
                    normalizedDistributionAmount <= 0
                  }
                  style={{
                    marginTop: "10px",
                    opacity:
                      !aidEmergencyId ||
                      cycleStatus.status !== "ACTIVE" ||
                      hasNoEligibleDonations ||
                      !selectedDonationId ||
                      !manualHouseholdId.trim() ||
                      !Number.isFinite(normalizedDistributionAmount) ||
                      normalizedDistributionAmount <= 0
                        ? 0.6
                        : 1,
                  }}
                  onClick={async () => {
                    if (
                      !aidEmergencyId ||
                      !aidCycle ||
                      !selectedDonationId ||
                      !manualHouseholdId.trim() ||
                      !Number.isFinite(normalizedDistributionAmount) ||
                      normalizedDistributionAmount <= 0
                    ) {
                      setDistributionFeedback({
                        type: "warning",
                        message: "Select a donation, select a household, and provide amount",
                      });
                      return;
                    }

                    try {
                      const result = await distributeAidAPI({
                        emergencyId: aidEmergencyId,
                        cycleId: aidCycle,
                        householdId: manualHouseholdId,
                        donationId: selectedDonationId,
                        amount: normalizedDistributionAmount,
                      });
                      if (result?.error) {
                        setDistributionFeedback({ type: "warning", message: result.error || result.message || "Aid distribution failed" });
                        setDistributionSummary(null);
                        await loadDistributionSummary(aidEmergencyId);
                        await loadAidAllocations(aidEmergencyId);
                        await loadReconciliation(aidEmergencyId);
                        return;
                      }

                      const summary = {
                        totalSuccessDonations: 0,
                        alreadyAllocatedCount: 0,
                        eligibleDonationsCount: 0,
                        newAllocations: Number(result?.newAllocations ?? 0),
                      };
                      setDistributionSummary(summary);

                      if (summary.newAllocations === 0) {
                        setDistributionFeedback({ type: "warning", message: "No new SUCCESS donations available for allocation." });
                      } else {
                        setDistributionFeedback({ type: "success", message: `Allocated ${summary.newAllocations} aid record(s).` });
                      }

                      setSelectedDonationId("");
                      setManualHouseholdId("");
                      setDistributionAmount("");
                      await loadDistributionSummary(aidEmergencyId);
                      await loadAidAllocations(aidEmergencyId);
                      await loadReconciliation(aidEmergencyId);
                      await loadCycleSummary(aidEmergencyId, aidCycle);
                      await loadDonations();
                    } catch {
                      setDistributionFeedback({ type: "warning", message: "Aid distribution failed" });
                      setDistributionSummary(null);
                      await loadDistributionSummary(aidEmergencyId);
                      await loadAidAllocations(aidEmergencyId);
                      await loadReconciliation(aidEmergencyId);
                    }
                  }}
                >
                  Distribute Aid
                </button>

                {distributionFeedback && (
                  <div className="note-text" style={{ marginTop: "10px", color: distributionFeedback.type === "success" ? "#166534" : "#b45309", fontWeight: 700 }}>
                    {distributionFeedback.message}
                  </div>
                )}

                {aidAllocations.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ fontWeight: 700, marginBottom: "6px" }}>Current Aid Records</div>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Household</th>
                          <th>Cycle</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aidAllocations.map((aid) => (
                          <tr key={aid._id}>
                            <td>{aid.householdId}</td>
                            <td>{aid.aidCycle}</td>
                            <td>{aid.allocatedAmount ?? aid.amountAllocated ?? 0}</td>
                            <td>{renderStatusBadge(aid.aidStatus)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </Card>

          <Card title="Proof of Delivery">
            {!aidEmergencyId ? (
              <p className="note-text">Select an emergency first to review allocated aid awaiting delivery proof.</p>
            ) : pendingProofRowsForEmergency.length === 0 ? (
              <p className="note-text">No ALLOCATED aid records are awaiting proof for this emergency.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Household</th>
                    <th>Cycle</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Upload Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingProofRowsForEmergency.map((aid) => (
                    <tr key={aid._id}>
                      <td>{aid.householdId}</td>
                      <td>{aid.aidCycle}</td>
                      <td>{aid.allocatedAmount ?? aid.amountAllocated ?? 0}</td>
                      <td>{renderStatusBadge(aid.aidStatus)}</td>
                      <td>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            setProofFileByAid((prev) => ({
                              ...prev,
                              [aid._id]: e.target.files?.[0] || null,
                            }))
                          }
                        />
                        <input
                          placeholder="Proof Description"
                          value={proofDescriptionByAid[aid._id] || ""}
                          onChange={(e) =>
                            setProofDescriptionByAid((prev) => ({
                              ...prev,
                              [aid._id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          className="btn-green"
                          onClick={async () => {
                            const selectedFile = proofFileByAid[aid._id];
                            const description = (proofDescriptionByAid[aid._id] || "").trim();

                            if (!selectedFile || !description) {
                              setNotice({ type: "error", message: "Select a proof file and enter description" });
                              return;
                            }

                            try {
                              const result = await uploadProofAPI({
                                aidId: aid._id,
                                description,
                                fileUrl: selectedFile.name,
                                proofData: `${aid._id}:${selectedFile.name}:${description}`,
                              });
                              if (result?.error) {
                                setNotice({ type: "error", message: result.error });
                                return;
                              }

                              setNotice({ type: "success", message: "Proof uploaded successfully" });
                              setProofDescriptionByAid((prev) => ({ ...prev, [aid._id]: "" }));
                              setProofFileByAid((prev) => ({ ...prev, [aid._id]: null }));
                              await loadAidAllocations(aidEmergencyId);
                              await loadReconciliation(aidEmergencyId);
                              await loadCycleSummary(aidEmergencyId, aid.aidCycle);
                            } catch {
                              setNotice({ type: "error", message: "Proof upload failed" });
                            }
                          }}
                        >
                          Upload Proof
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Transparency Dashboard">
            {!aidEmergencyId || !reconciliation ? (
              <p className="note-text">Select an emergency to view end-to-end transparency metrics.</p>
            ) : (
              <div className="grid">
                <div className="impact-box">
                  <div>Total Donations</div>
                  <div style={{ fontWeight: 700, marginTop: "6px" }}>
                    Rs. {reconciliation.totalSuccessAmount ?? 0}
                  </div>
                </div>
                <div className="impact-box">
                  <div>Total Distributed</div>
                  <div style={{ fontWeight: 700, marginTop: "6px" }}>
                    Rs. {reconciliation.totalAllocatedAmount ?? 0}
                  </div>
                </div>
                <div className="impact-box">
                  <div>Households Served</div>
                  <div style={{ fontWeight: 700, marginTop: "6px" }}>
                    {reconciliation.totalBeneficiariesServed ?? 0}
                  </div>
                </div>
                <div className="impact-box">
                  <div>Pending Proofs</div>
                  <div style={{ fontWeight: 700, marginTop: "6px" }}>
                    {pendingProofCount}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {view === "beneficiary" && (
        <Card title="Beneficiary Management">
          {loadingBeneficiaries ? (
            <p>Loading beneficiaries...</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Unique ID</th>
                  <th>Status</th>
                  <th>Beneficiary ID</th>
                  <th>Household ID</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {beneficiaries.length === 0 && (
                  <tr>
                    <td colSpan="6">No beneficiaries found</td>
                  </tr>
                )}
                {beneficiaries.map((b) => (
                  <tr key={b._id}>
                    <td>{b.name}</td>
                    <td>{b.uniqueId}</td>
                    <td>{renderStatusBadge(b.status)}</td>
                    <td>{b.beneficiaryId || "-"}</td>
                    <td>{b.householdId || "-"}</td>
                    <td>
                      {b.status === "PENDING" && (
                        <button
                          className="btn-green"
                          onClick={async () => {
                            try {
                              const result = await verifyBeneficiaryAPI(b._id);
                              if (result?.error) {
                                setNotice({ type: "error", message: result.error });
                                return;
                              }
                              if (result?.message && result.message !== "Beneficiary verified") {
                                setNotice({ type: "error", message: result.message });
                                return;
                              }
                              setNotice({
                                type: "success",
                                message: `Beneficiary verified with household ID ${result?.beneficiary?.householdId || ""}`.trim(),
                              });
                              loadBeneficiaries();
                            } catch {
                              setNotice({ type: "error", message: "Verification failed" });
                            }
                          }}
                        >
                          Verify
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {view === "donations" && (
        <Card title="All Collected Donations">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Donor</th>
                <th>Emergency</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {donations.length === 0 && (
                <tr>
                  <td colSpan="5">No donations found</td>
                </tr>
              )}
              {donations.map((d) => (
                <tr key={d._id}>
                  <td>{d._id}</td>
                  <td>{d.donorName || d.donorId?.name || d.donorId || "-"}</td>
                  <td>{d.emergencyId}</td>
                  <td>{d.amount}</td>
                  <td>{d.paymentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {view === "aid" && (
        <Card title="Aid Distribution">
          <select
            value={aidEmergencyId}
            onChange={(e) => {
              setAidEmergencyId(e.target.value);
              setSelectedDonationId("");
              setManualHouseholdId("");
              setDistributionAmount("");
              setCycleFeedback(null);
              setDistributionFeedback(null);
              setNotice(null);
            }}
          >
            <option value="">Select Emergency</option>
            {emergencyOptions.map((e) => (
              <option key={e._id} value={e._id}>
                {e.title} ({e._id})
              </option>
            ))}
          </select>

          {aidEmergencyId && cycleStatus.status === "ACTIVE" && (
            <div className="note-text" style={{ marginTop: "8px", color: "#166534", fontWeight: 700 }}>
              {"\uD83D\uDFE2"} Active Cycle: {cycleStatus.cycleId}
            </div>
          )}
          {aidEmergencyId && cycleStatus.status === "NONE" && (
            <div className="note-text" style={{ marginTop: "8px", color: "#b45309", fontWeight: 700 }}>
              {"\uD83D\uDD34"} No Active Cycle
            </div>
          )}

          {aidEmergencyId && cycleStatus.status === "NONE" && (
            <>
              <input
                placeholder="Aid Cycle (e.g. CYCLE-2026-01)"
                value={aidCycle}
                onChange={(e) => setAidCycle(e.target.value)}
              />
              <button
                className="btn-green"
                onClick={async () => {
                  if (!aidEmergencyId || !aidCycle) {
                    setCycleFeedback({ type: "warning", message: "Enter emergency and cycle ID to start a cycle." });
                    return;
                  }
                  try {
                    const result = await startAidCycleAPI({ emergencyId: aidEmergencyId, cycleId: aidCycle });
                    if (result?.error) {
                      setCycleFeedback({ type: "error", message: result.error || "Failed to start cycle" });
                      return;
                    }
                    setCycleFeedback({ type: "success", message: result?.message || "Cycle started successfully" });
                    await loadCycleStatus(aidEmergencyId);
                    await loadCycles(aidEmergencyId);
                    await loadDistributionSummary(aidEmergencyId);
                    await loadReconciliation(aidEmergencyId);
                  } catch {
                    setCycleFeedback({ type: "error", message: "Failed to start cycle" });
                  }
                }}
              >
                Start New Cycle
              </button>
            </>
          )}

          {aidEmergencyId && cycleStatus.status === "ACTIVE" && (
            <button
              className="btn-blue"
              onClick={async () => {
                try {
                  const result = await closeAidCycleAPI({ emergencyId: aidEmergencyId });
                  if (result?.error) {
                    setCycleFeedback({ type: "error", message: result.error });
                    return;
                  }
                  setCycleFeedback({ type: "success", message: result?.message || "Cycle closed successfully" });
                  await loadCycleStatus(aidEmergencyId);
                  await loadCycles(aidEmergencyId);
                  await loadDistributionSummary(aidEmergencyId);
                  await loadReconciliation(aidEmergencyId);
                } catch {
                  setCycleFeedback({ type: "error", message: "Failed to close cycle" });
                }
              }}
            >
              Close Cycle
            </button>
          )}

          <button
            className="btn-blue"
            onClick={async () => {
              await loadCycleStatus(aidEmergencyId);
              await loadCycles(aidEmergencyId);
              await loadDistributionSummary(aidEmergencyId);
              await loadAidAllocations(aidEmergencyId);
              await loadReconciliation(aidEmergencyId);
            }}
          >
            Refresh Cycles
          </button>

          {cycleFeedback && (
            <div
              className="note-text"
              style={{
                marginTop: "8px",
                color: cycleFeedback.type === "error" ? "#b91c1c" : cycleFeedback.type === "warning" ? "#b45309" : "#166534",
                fontWeight: 700,
              }}
            >
              {cycleFeedback.message}
            </div>
          )}

          {cycleList.length > 0 && (
            <div className="note-text" style={{ marginTop: "6px" }}>
              {cycleList.map((c) => (
                <div key={c._id}>{c.cycleId} - {c.status}</div>
              ))}
            </div>
          )}

          {aidEmergencyId && donationPoolSummary && (
            <div style={{ marginTop: "12px", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#f9fafb" }}>
              <div style={{ fontWeight: 700, marginBottom: "8px" }}>{"\uD83D\uDCB0"} DONATION POOL SUMMARY</div>
              <div className="note-text">Total SUCCESS Donations: {donationPoolSummary.totalSuccessDonations ?? 0}</div>
              <div className="note-text">Total SUCCESS Amount: Rs. {donationPoolSummary.totalSuccessAmount ?? 0}</div>
              <div className="note-text" style={{ color: "#6b7280" }}>
                Already Allocated: {donationPoolSummary.totalAllocatedDonations ?? 0} (Rs. {donationPoolSummary.totalAllocatedAmount ?? 0})
              </div>
              <div className="note-text" style={{ color: "#166534", fontWeight: 600 }}>
                Available for Allocation: {donationPoolSummary.eligibleDonationCount ?? 0} (Rs. {donationPoolSummary.eligibleDonationAmount ?? 0})
              </div>
              <div className="note-text" style={{ marginTop: "4px" }}>
                Active Cycle: {donationPoolSummary.activeCycle?.cycleId || "NONE"}
              </div>

              <div style={{ marginTop: "10px", borderTop: "1px solid #e5e7eb", paddingTop: "10px" }}>
                <div style={{ fontWeight: 700, marginBottom: "6px" }}>{"\uD83D\uDCB0"} FUND UTILIZATION</div>
                {totalSuccessAmount === 0 ? (
                  <div className="note-text" style={{ color: "#6b7280" }}>No SUCCESS donations yet.</div>
                ) : (
                  <>
                    <div style={{ width: "100%", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden", height: "12px" }}>
                      <div style={{ width: `${utilizationPercent.toFixed(2)}%`, background: "#16a34a", height: "100%", transition: "width 400ms ease" }} />
                    </div>
                    <div className="note-text" style={{ marginTop: "6px", fontWeight: 700 }}>{utilizationPercent.toFixed(0)}%</div>
                    <div className="note-text">Allocated: Rs. {totalAllocatedAmount} / Rs. {totalSuccessAmount}</div>
                  </>
                )}
              </div>

              {(donationPoolSummary.eligibleDonationCount ?? 0) === 0 ? (
                <div className="note-text" style={{ marginTop: "6px", color: "#b45309", fontWeight: 700 }}>
                  No new SUCCESS donations available for allocation.
                </div>
              ) : (
                <div className="note-text" style={{ marginTop: "6px", color: "#166534", fontWeight: 700 }}>
                  You can allocate up to {donationPoolSummary.eligibleDonationCount} donations in this cycle.
                </div>
              )}
            </div>
          )}

          {aidEmergencyId && cycleStatus.status === "ACTIVE" && cycleSummary && (
            <div style={{ marginTop: "12px", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#f9fafb" }}>
              <div style={{ fontWeight: 700, marginBottom: "8px" }}>{"\uD83D\uDCE6"} CYCLE SUMMARY - {cycleSummary.cycleId}</div>
              <div className="note-text">Beneficiaries Served: {cycleSummary.beneficiariesServed ?? 0}</div>
              <div className="note-text">Allocations Created: {cycleSummary.totalAllocations ?? 0}</div>
              <div className="note-text">Total Allocated: Rs. {cycleSummary.totalAllocatedAmount ?? 0}</div>
              <div className="note-text">Delivered: {cycleSummary.deliveredCount ?? 0}</div>
              <div className="note-text">Pending Delivery: {cycleSummary.allocatedCount ?? 0}</div>
            </div>
          )}

          {aidEmergencyId && reconciliation && (
            <div style={{ marginTop: "12px", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#f9fafb" }}>
              <div style={{ fontWeight: 700, marginBottom: "8px" }}>{"\uD83D\uDCCA"} FINANCIAL RECONCILIATION</div>
              <div style={{ borderTop: "1px solid #e5e7eb", marginBottom: "8px" }} />
              <div className="note-text">Total Funds Raised: Rs. {reconciliation.totalSuccessAmount ?? 0}</div>
              <div className="note-text">Total Funds Allocated: Rs. {reconciliation.totalAllocatedAmount ?? 0}</div>
              <div className="note-text">Remaining Balance: Rs. {reconciliation.unallocatedAmount ?? 0}</div>
              <div className="note-text">Beneficiaries Served: {reconciliation.totalBeneficiariesServed ?? 0}</div>
              <div className="note-text">Total Aid Records: {reconciliation.totalAidRecords ?? 0}</div>
              <div className="note-text">Proofs Submitted: {reconciliation.totalProofsSubmitted ?? 0}</div>
            </div>
          )}

          {aidEmergencyId && cycleStatus.status === "ACTIVE" && (
            <div style={{ marginTop: "12px", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#f9fafb" }}>
              <div style={{ fontWeight: 700, marginBottom: "8px" }}>Manual Aid Distribution</div>
              <select
                value={selectedDonationId}
                onChange={(e) => setSelectedDonationId(e.target.value)}
              >
                <option value="">Select SUCCESS Donation</option>
                {eligibleDonationsForDistribution.map((d) => {
                  const allocatedAmount = Number(allocatedByDonationId[String(d._id)] || 0);
                  const remainingFunds = Math.max(0, Number(d.amount || 0) - allocatedAmount);
                  return (
                    <option key={d._id} value={d._id}>
                      {`${d.donorName || "Unknown Donor"} • ₹${d.amount} • ${formatDonationOptionDate(d.createdAt)}`}
                    </option>
                  );
                })}
              </select>
              <input
                placeholder="Household ID"
                value={manualHouseholdId}
                onChange={(e) => setManualHouseholdId(e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={distributionAmount}
                onChange={(e) => setDistributionAmount(e.target.value)}
              />
            </div>
          )}

          <button
            className="btn-blue"
            disabled={
              !aidEmergencyId ||
              cycleStatus.status !== "ACTIVE" ||
              hasNoEligibleDonations ||
              !selectedDonationId ||
              !manualHouseholdId.trim() ||
              !Number.isFinite(normalizedDistributionAmount) ||
              normalizedDistributionAmount <= 0
            }
            style={{
              marginTop: "10px",
              opacity:
                !aidEmergencyId ||
                cycleStatus.status !== "ACTIVE" ||
                hasNoEligibleDonations ||
                !selectedDonationId ||
                !manualHouseholdId.trim() ||
                !Number.isFinite(normalizedDistributionAmount) ||
                normalizedDistributionAmount <= 0
                  ? 0.6
                  : 1,
            }}
            onClick={async () => {
              if (
                !aidEmergencyId ||
                !aidCycle ||
                !selectedDonationId ||
                !manualHouseholdId.trim() ||
                !Number.isFinite(normalizedDistributionAmount) ||
                normalizedDistributionAmount <= 0
              ) {
                setDistributionFeedback({
                  type: "warning",
                  message: "Select a donation, enter household ID, and provide amount",
                });
                return;
              }

              try {
                const result = await distributeAidAPI({
                  emergencyId: aidEmergencyId,
                  cycleId: aidCycle,
                  householdId: manualHouseholdId,
                  donationId: selectedDonationId,
                  amount: normalizedDistributionAmount,
                });
                if (result?.error) {
                  setDistributionFeedback({ type: "warning", message: result.error || result.message || "Aid distribution failed" });
                  setDistributionSummary(null);
                  await loadDistributionSummary(aidEmergencyId);
                  await loadAidAllocations(aidEmergencyId);
                  await loadReconciliation(aidEmergencyId);
                  return;
                }

                const summary = {
                  totalSuccessDonations: 0,
                  alreadyAllocatedCount: 0,
                  eligibleDonationsCount: 0,
                  newAllocations: Number(result?.newAllocations ?? 0),
                };
                setDistributionSummary(summary);

                if (summary.newAllocations === 0) {
                  setDistributionFeedback({ type: "warning", message: "No new SUCCESS donations available for allocation." });
                } else {
                  setDistributionFeedback({ type: "success", message: `Allocated ${summary.newAllocations} aid record(s).` });
                }

                setSelectedDonationId("");
                setManualHouseholdId("");
                setDistributionAmount("");
                await loadDistributionSummary(aidEmergencyId);
                await loadAidAllocations(aidEmergencyId);
                await loadReconciliation(aidEmergencyId);
                await loadCycleSummary(aidEmergencyId, aidCycle);
                await loadDonations();
              } catch {
                setDistributionFeedback({ type: "warning", message: "Aid distribution failed" });
                setDistributionSummary(null);
                await loadDistributionSummary(aidEmergencyId);
                await loadAidAllocations(aidEmergencyId);
                await loadReconciliation(aidEmergencyId);
              }
            }}
          >
            Distribute Aid
          </button>

          {distributionFeedback && (
            <div className="note-text" style={{ marginTop: "10px", color: distributionFeedback.type === "success" ? "#166534" : "#b45309", fontWeight: 700 }}>
              {distributionFeedback.message}
            </div>
          )}
          {distributionSummary && (
            <div className="note-text" style={{ marginTop: "8px", lineHeight: 1.8 }}>
              <div>Total SUCCESS donations: {distributionSummary.totalSuccessDonations ?? 0}</div>
              <div>Already allocated: {distributionSummary.alreadyAllocatedCount ?? 0}</div>
              <div>Eligible donations: {distributionSummary.eligibleDonationsCount ?? 0}</div>
              <div>Newly allocated: {distributionSummary.newAllocations}</div>
            </div>
          )}

          <div style={{ marginTop: "12px" }}>
            <div style={{ fontWeight: 700, marginBottom: "6px" }}>Aid Allocation Table</div>
            {aidAllocations.length === 0 ? (
              <p className="note-text">No aid allocations found for this emergency.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Beneficiary ID</th>
                    <th>Household ID</th>
                    <th>Aid Cycle</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {aidAllocations.map((a) => (
                    <tr key={a._id}>
                      <td>{a.beneficiaryId}</td>
                      <td>{a.householdId}</td>
                      <td>{a.aidCycle}</td>
                      <td>{renderStatusBadge(a.aidStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {view === "proof" && (
        <Card title="Upload Aid Proof">
          <select
            value={proofEmergencyId}
            onChange={(e) => {
              setProofEmergencyId(e.target.value);
              setProofDescriptionByAid({});
              setProofFileByAid({});
            }}
          >
            <option value="">Select Emergency</option>
            {emergencyOptions.map((e) => (
              <option key={e._id} value={e._id}>
                {e.title} ({e._id})
              </option>
            ))}
          </select>
          <div style={{ marginTop: "12px" }}>
            {proofEmergencyId && proofRows.length === 0 ? (
              <p className="note-text">No ALLOCATED aid records are awaiting proof for this emergency.</p>
            ) : (
              proofRows.length > 0 && (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Household</th>
                      <th>Cycle</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Upload Proof</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proofRows.map((aid) => (
                      <tr key={aid._id}>
                        <td>{aid.householdId}</td>
                        <td>{aid.aidCycle}</td>
                        <td>{aid.allocatedAmount ?? aid.amountAllocated ?? 0}</td>
                        <td>{renderStatusBadge(aid.aidStatus)}</td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileChange(aid._id, e.target.files?.[0])}
                            />
                            <button
                              className="btn-green"
                              disabled={!proofFileByAid[aid._id]}
                              onClick={() => handleUpload(aid)}
                            >
                              Upload Proof
                            </button>
                          </div>
                          <input
                            placeholder="Proof Description"
                            value={proofDescriptionByAid[aid._id] || ""}
                            onChange={(e) =>
                              setProofDescriptionByAid((prev) => ({
                                ...prev,
                                [aid._id]: e.target.value,
                              }))
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </Card>
      )}

      {view === "emergency" && (
        <Card title="Add New Emergency">
          <input
            placeholder="Title"
            value={emergencyTitle}
            onChange={(e) => setEmergencyTitle(e.target.value)}
          />
          <input
            placeholder="Severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          />
          <textarea
            placeholder="Description"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            className="btn-blue"
            onClick={handleCreateEmergency}
          >
            Add Emergency
          </button>
        </Card>
      )}
    </>
  );
}
