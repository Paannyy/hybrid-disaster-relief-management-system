import { useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import DonorDashboard from "./pages/DonorDashboard";
import BeneficiaryDashboard from "./pages/BeneficiaryDashboard";

export default function App() {
  const [role, setRole] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [registerType, setRegisterType] = useState("DONOR");

  if (!role) {
    return showRegister ? (
      <Register
        accountType={registerType}
        onRegistered={() => setShowRegister(false)}
      />
    ) : (
      <Login
        onLogin={setRole}
        onShowRegister={(type) => {
          setRegisterType(type || "DONOR");
          setShowRegister(true);
        }}
      />
    );
  }

  // Role-based routing (normalize to lowercase for safety)
  const normalized = role?.toString().toLowerCase();
  if (normalized === "admin") return <AdminDashboard />;
  if (normalized === "donor") return <DonorDashboard />;
  if (normalized === "beneficiary") return <BeneficiaryDashboard />;

  return null;
}
