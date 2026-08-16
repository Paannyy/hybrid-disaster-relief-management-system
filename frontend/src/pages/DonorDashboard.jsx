import { useEffect, useState } from "react";
import {
  getEmergenciesAPI,
  createDonationAPI,
  confirmPaymentAPI,
  getTransactionsAPI,
  getDonationTraceAPI,
} from "../api/api";

import DonorNavbar from "../components/DonorNavbar";
import Slider from "../components/Slider";
import Card from "../components/Card";
import Footer from "../components/Footer";
import "../pages/pages.css";

export default function DonorDashboard() {
  const [view, setView] = useState("home");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [amount, setAmount] = useState("");

  const [emergencies, setEmergencies] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [traceByDonation, setTraceByDonation] = useState({});
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getEmergenciesAPI()
      .then((data) => {
        if (!cancelled) setEmergencies(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setEmergencies([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (view !== "transactions") return;

    let cancelled = false;
    getTransactionsAPI()
      .then((data) => {
        if (!cancelled) setTransactions(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setTransactions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [view]);

  const handlePayment = async () => {
    if (!amount || !selectedEmergency) {
      setNotice({ type: "error", message: "Please select emergency and enter amount" });
      return;
    }

    try {
      const res = await createDonationAPI({
        emergencyId: selectedEmergency._id,
        amount: Number(amount),
        paymentMethod,
      });

      if (res?.error) {
        setNotice({ type: "error", message: res.error });
        return;
      }

      if (res?.donationId) {
        await confirmPaymentAPI({
          donationId: res.donationId,
          status: "SUCCESS",
          transactionId: `SIM-${Date.now()}`,
        });
      }

      setNotice({ type: "success", message: "Donation recorded successfully" });
      setAmount("");
      setSelectedEmergency(null);
      setView("transactions");
    } catch {
      setNotice({ type: "error", message: "Donation failed" });
    }
  };

  const handleTrace = async (donationId) => {
    try {
      const data = await getDonationTraceAPI(donationId);
      if (data?.error) {
        setNotice({ type: "error", message: data.error });
        return;
      }
      setTraceByDonation((prev) => ({ ...prev, [donationId]: data }));
    } catch {
      setNotice({ type: "error", message: "Trace fetch failed" });
    }
  };

  const renderStatusBadge = (status) => {
    const normalizedStatus = (status || "").toUpperCase();
    const statusMap = {
      PENDING: { className: "status-pending", label: "🟡 Pending" },
      ALLOCATED: { className: "status-allocated", label: "🔵 Allocated" },
      DELIVERED: { className: "status-delivered", label: "🟢 Delivered" },
    };
    const config = statusMap[normalizedStatus];
    return config ? <span className={config.className}>{config.label}</span> : status || "-";
  };

  const renderTraceFlow = (traceData) => {
    const donation = traceData?.donation || null;
    const aid = traceData?.aid || null;
    const chainClaim = traceData?.chainClaim || null;
    const allocationStatusMessage = aid ? "Aid allocated" : "Waiting for allocation";
    const blockchainStatusMessage = aid
      ? chainClaim || aid?.onChainTxId || aid?.blockchainHash
        ? "Blockchain claim available"
        : "Blockchain record pending"
      : "Waiting for allocation";
    const proofStatusMessage = aid?.proofHash ? "Proof uploaded" : "Proof not uploaded yet";

    return (
      <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px", background: "#f9fafb" }}>
          <div style={{ fontWeight: 700 }}>{"\uD83D\uDCB0"} Donation</div>
          <div className="note-text">Amount: Rs. {donation?.amount ?? 0}</div>
          <div className="note-text">Status: {renderStatusBadge(donation?.paymentStatus)}</div>
        </div>

        <div className="note-text" style={{ textAlign: "center", fontWeight: 700 }}>{allocationStatusMessage}</div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px", background: aid ? "#f9fafb" : "#f3f4f6" }}>
          <div style={{ fontWeight: 700 }}>{"\uD83D\uDCE6"} Aid Allocation</div>
          {aid ? (
            <>
              <div className="note-text">Status: {renderStatusBadge(aid.aidStatus)}</div>
              <div className="note-text">Allocated: Rs. {aid.amountAllocated ?? 0}</div>
            </>
          ) : (
            <div className="note-text" style={{ color: "#6b7280" }}>Waiting for allocation...</div>
          )}
        </div>

        <div className="note-text" style={{ textAlign: "center", fontWeight: 700 }}>{blockchainStatusMessage}</div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px", background: aid ? "#f9fafb" : "#f3f4f6" }}>
          <div style={{ fontWeight: 700 }}>{"\uD83D\uDD17"} Blockchain Claim</div>
          {aid && (chainClaim || aid?.onChainTxId || aid?.blockchainHash) ? (
            <>
              <div className="note-text">Claim ID: {aid.claimId || "-"}</div>
              <div className="note-text">Tx ID: {aid.onChainTxId || chainClaim?.txId || "-"}</div>
              <div className="note-text">Hash: {aid.blockchainHash || chainClaim?.ledgerHash || "-"}</div>
            </>
          ) : aid ? (
            <div className="note-text" style={{ color: "#6b7280" }}>Blockchain record pending</div>
          ) : (
            <div className="note-text" style={{ color: "#6b7280" }}>Waiting for allocation</div>
          )}
        </div>

        <div className="note-text" style={{ textAlign: "center", fontWeight: 700 }}>{proofStatusMessage}</div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px", background: aid?.proofHash ? "#f9fafb" : "#f3f4f6" }}>
          <div style={{ fontWeight: 700 }}>{"\uD83D\uDCC4"} Proof of Delivery</div>
          {aid?.proofHash ? (
            <div className="note-text">Proof Hash: {aid.proofHash}</div>
          ) : (
            <div className="note-text" style={{ color: "#6b7280" }}>Proof not uploaded yet</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <DonorNavbar setView={setView} />
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
          <Slider />

          <Card title="Latest Emergencies">
            <div className="grid">
              {emergencies.map((e) => (
                <div key={e._id} className="emergency-card">
                  <h4>{e.title}</h4>
                  <p>Severity: {e.severity}</p>
                  <button
                    className="btn-green"
                    onClick={() => {
                      setSelectedEmergency(e);
                      setView("donate");
                    }}
                  >
                    Donate
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Our Work">
            <div className="work-grid">
              <div className="work-card">
                <img src="/images/work1.png" alt="Aid Distribution" />
                <h4>Aid Distribution</h4>
                <p>Relief materials delivered to verified beneficiaries.</p>
              </div>

              <div className="work-card">
                <img src="/images/work2.png" alt="Transparent Tracking" />
                <h4>Transparent Tracking</h4>
                <p>Every donation is traceable from donor to beneficiary.</p>
              </div>

              <div className="work-card">
                <img src="/images/work3.png" alt="Blockchain Verification" />
                <h4>Blockchain Verification</h4>
                <p>Immutable records ensure trust and prevent fraud.</p>
              </div>

              <div className="work-card">
                <img src="/images/work4.webp" alt="Emergency Response" />
                <h4>Emergency Response</h4>
                <p>Fast response during disasters.</p>
              </div>
            </div>
          </Card>
        </>
      )}

      {view === "emergencies" && (
        <Card title="All Active Emergencies">
          <div className="emergency-grid">
            {emergencies.map((e) => (
              <div key={e._id} className="emergency-card-advanced">
                <div className="emergency-header">
                  <h3>{e.title}</h3>
                  <span className="severity-badge">{e.severity}</span>
                </div>

                <button
                  className="btn-donate"
                  onClick={() => {
                    setSelectedEmergency(e);
                    setView("donate");
                  }}
                >
                  Donate Now
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {view === "donate" && (
        <Card title="Donate Money">
          {selectedEmergency && (
            <p>
              Donating for: <strong>{selectedEmergency.title}</strong>
            </p>
          )}

          <input
            placeholder="Enter Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="UPI">UPI</option>
            <option value="NET_BANKING">Net Banking</option>
            <option value="CARD">Debit Card</option>
          </select>

          <button className="btn-green" onClick={handlePayment}>
            Pay {amount || "0"}
          </button>
        </Card>
      )}

      {view === "transactions" && (
        <Card title="Transaction History">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Emergency</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Trace</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5">No transactions</td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t._id}>
                    <td>{t._id}</td>
                    <td>{t.emergencyId}</td>
                    <td>{t.amount}</td>
                    <td>{renderStatusBadge(t.paymentStatus)}</td>
                    <td>
                      <button className="btn-blue" onClick={() => handleTrace(t._id)}>
                        Trace
                      </button>
                      {traceByDonation[t._id] && renderTraceFlow(traceByDonation[t._id])}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      <Footer />
    </>
  );
}
