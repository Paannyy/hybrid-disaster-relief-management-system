import { useEffect, useState } from "react";
import { registerAPI, registerBeneficiaryAPI } from "../api/api";
import "../pages/pages.css";

export default function Register({ accountType = "DONOR", onRegistered }) {
  const normalizedType = accountType.toString().toUpperCase();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: normalizedType,
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      role: normalizedType,
    }));
  }, [normalizedType]);

  const handleSubmit = async () => {
    const { name, email, password } = form;
    if (!name || !email || !password) {
      alert("All fields required");
      return;
    }
    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }
    const registerCall =
      normalizedType === "BENEFICIARY" ? registerBeneficiaryAPI : registerAPI;
    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      role: normalizedType,
    };
    console.log("[Register] registration payload:", payload);
    const res = await registerCall(payload);
    console.log("[Register] register response:", res);
    if (res.user) {
      alert("Registered successfully – please login");
      onRegistered(); // drop back to login
    } else {
      alert(res.error || res.message || "Registration failed");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Sign Up</h2>
        <input
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <p className="note-text">
          New account type: {accountType === "BENEFICIARY" ? "Beneficiary" : "Donor"}
        </p>
        <button className="btn-blue" onClick={handleSubmit}>
          Register
        </button>
        <p>
          Already have an account?{" "}
          <a href="#" onClick={onRegistered}>
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
