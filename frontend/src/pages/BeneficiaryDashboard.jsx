import { useState, useEffect } from "react";
import Card from "../components/Card";
import {
  submitBeneficiaryAPI,
  getBeneficiaryStatusAPI,
  getAidAPI,
  getAidStatusAPI,
} from "../api/api";
import "../pages/pages.css";

export default function BeneficiaryDashboard() {
  const [view, setView] = useState("home");

  const [status, setStatus] = useState("NOT_REGISTERED");
  const [beneficiaryData, setBeneficiaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aidRecords, setAidRecords] = useState([]);
  const [lastCycleChecked, setLastCycleChecked] = useState("NONE");
  const [latestAidStatus, setLatestAidStatus] = useState("PENDING");

  const [form, setForm] = useState({
    name: "",
    familyMembers: "",
    uniqueId: "",
  });

  /* ================= FETCH STATUS ================= */
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await getBeneficiaryStatusAPI();

      if (!data || data.status === "NOT_REGISTERED") {
        setStatus("NOT_REGISTERED");
        setBeneficiaryData(null);
      } else {
        setStatus(data.status);
        setBeneficiaryData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAid = async () => {
    try {
      const res = await getAidAPI();
      console.log("[BeneficiaryDashboard] fetchAid raw response:", res);
      const responseData = res?.data ?? res;
      const records = Array.isArray(responseData) ? responseData : responseData?.aids || [];
      if (records.length > 0) {
        setLastCycleChecked(records[0]?.aidCycle || "NONE");
      }
      console.log("[BeneficiaryDashboard] fetchAid processed aids:", records);
      setAidRecords(records);
      console.log("[BeneficiaryDashboard] debug beneficiary/aid count:", {
        beneficiaryObjectId: beneficiaryData?._id,
        aidCount: records.length,
      });
      if (records.length === 0) {
        console.log("If aidRecords = 0 \u2192 either no Aid exists OR logged-in beneficiary mismatch");
      }
      console.log(
        "[BeneficiaryDashboard] fetchAid state right after setAidRecords (pre-react-update):",
        aidRecords
      );
    } catch (err) {
      console.error(err);
      setAidRecords([]);
    }
  };

  const fetchAidStatus = async () => {
    try {
      const res = await getAidStatusAPI();
      const normalizedStatus = (res?.status || "PENDING").toUpperCase();
      setLatestAidStatus(normalizedStatus);
    } catch (err) {
      console.error(err);
      setLatestAidStatus("PENDING");
    }
  };

  /* ================= AUTO LOAD ================= */
  useEffect(() => {
    fetchStatus();
    fetchAidStatus();
  }, []);

  useEffect(() => {
    if (view === "aid") {
      fetchAid();
    }
    if (view === "status") {
      fetchAidStatus();
    }
  }, [view]);

  useEffect(() => {
    console.log("[BeneficiaryDashboard] aidRecords state updated:", aidRecords);
    if (aidRecords.length === 0) {
      console.log("If aidRecords = 0 \u2192 either no Aid exists OR logged-in beneficiary mismatch");
    }
  }, [aidRecords]);

  /* ================= REGISTER ================= */
  const handleRegister = async () => {
    if (!form.name || !form.familyMembers || !form.uniqueId) {
      alert("Fill all fields");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        familyMembers: Number(form.familyMembers),
        uniqueId: form.uniqueId.trim(),
        proofUrl: "ration-proof.jpg",
      };

      console.log("[BeneficiaryDashboard] register payload:", payload);

      const res = await submitBeneficiaryAPI(payload);
      console.log("[BeneficiaryDashboard] register response:", res);

      if (res.beneficiaryId) {
        await fetchStatus();
        await fetchAidStatus();
        setForm({ name: "", familyMembers: "", uniqueId: "" });
        setView("home");
      } else {
        alert(res.error || res.message || "Registration failed");
      }
    } catch (err) {
      console.error("[BeneficiaryDashboard] registration failed:", err);
      alert("Registration failed (duplicate or server error)");
    }
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

  const renderAidStatusMessage = (value) => {
    const normalizedStatus = (value || "").toUpperCase();
    if (normalizedStatus === "DELIVERED") {
      return "Aid successfully delivered";
    }
    if (normalizedStatus === "ALLOCATED") {
      return "Aid allocated, awaiting delivery";
    }
    return "Aid will be allocated soon";
  };

  return (
    <>
      {/* ===== NAVBAR ===== */}
      <div className="admin-navbar">
        <h2 className="logo">Beneficiary Panel</h2>
        <ul>
          <li onClick={() => setView("home")}>Dashboard</li>
          <li onClick={() => setView("register")}>Register</li>
          <li onClick={() => setView("status")}>Aid Status</li>
          <li onClick={() => setView("aid")}>Aid Received</li>
          <li
            className="logout"
            onClick={() => {
              localStorage.removeItem("TOKEN");
              localStorage.removeItem("ROLE");
              window.location.reload();
            }}
          >
            Logout
          </li>
        </ul>
      </div>

      {/* ===== HOME ===== */}
      {view === "home" && (
        <Card title="Beneficiary Status">
          {loading && <p>Loading status...</p>}

          {!loading && status === "NOT_REGISTERED" && (
            <p>Please register to receive aid.</p>
          )}

          {!loading && status === "PENDING" && (
            <p>{renderStatusBadge("PENDING")} Your application is under admin verification.</p>
          )}

          {!loading && status === "APPROVED" && beneficiaryData && (
            <>
              <p><strong>Name:</strong> {beneficiaryData.name}</p>
              <p><strong>Beneficiary ID:</strong> {beneficiaryData.beneficiaryId}</p>
              <p><strong>Household ID:</strong> {beneficiaryData.householdId}</p>
            </>
          )}
        </Card>
      )}

      {/* ===== REGISTER ===== */}
      {view === "register" && (
        <Card title="Beneficiary Registration">
          <input
            placeholder="Full Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Family Members"
            value={form.familyMembers}
            onChange={(e) =>
              setForm({ ...form, familyMembers: e.target.value })
            }
          />

          <input
            placeholder="Government Unique ID (Ration Card No.)"
            value={form.uniqueId}
            onChange={(e) =>
              setForm({ ...form, uniqueId: e.target.value })
            }
          />

          <input type="file" />

          <button className="btn-green" onClick={handleRegister}>
            Submit Registration
          </button>
        </Card>
      )}

      {/* ===== AID STATUS ===== */}
      {view === "status" && (
        <Card title="Aid Status">
          {status === "APPROVED" ? (
            <>
              <p>{renderStatusBadge(latestAidStatus)} {renderAidStatusMessage(latestAidStatus)}</p>
              <button
                className="btn-blue"
                onClick={async () => {
                  await fetchAidStatus();
                  await fetchAid();
                }}
              >
                Refresh Aid
              </button>
            </>
          ) : (
            <p>No aid available yet.</p>
          )}
        </Card>
      )}

      {/* ===== AID RECORDS ===== */}
      {view === "aid" && (
        <Card title="Aid Received">
          <button className="btn-blue" onClick={fetchAid}>
            Refresh Aid
          </button>
          {aidRecords && aidRecords.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Emergency</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Hash</th>
                </tr>
              </thead>
              <tbody>
                {aidRecords.map((a) => (
                  <tr key={a._id}>
                    <td>{a.emergencyId}</td>
                    <td>₹{a.amountAllocated}</td>
                    <td>{renderStatusBadge(a.aidStatus)}</td>
                    <td>{a.blockchainHash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <>
              <p>No aid has been allocated to this beneficiary yet.</p>
              <p className="note-text">Beneficiary ID: {beneficiaryData?.beneficiaryId || "N/A"}</p>
              <p className="note-text">Household ID: {beneficiaryData?.householdId || "N/A"}</p>
              <p className="note-text">Last cycle checked: {lastCycleChecked}</p>
            </>
          )}
        </Card>
      )}
    </>
  );
}
