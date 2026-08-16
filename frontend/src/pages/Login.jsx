import { useState } from "react";
import "../pages/pages.css";
import { loginAPI } from "../api/api";

export default function Login({ onLogin, onShowRegister }) {
  const [role, setRole] = useState("Donor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      const res = await loginAPI({ email, password });
      console.log("login response:", res);
      if (!res || !res.token || !res.role) {
        alert(res?.message || "Login failed");
        return;
      }

      localStorage.setItem("TOKEN", res.token);
      localStorage.setItem("ROLE", res.role);
      onLogin(res.role);
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Disaster Relief Portal</h2>

        <label>Login as</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="Admin">Admin</option>
          <option value="Donor">Donor</option>
          <option value="Beneficiary">Beneficiary</option>
        </select>

        <input
          type="email"
          placeholder="Email ID"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn-blue" onClick={handleLogin}>
          Login
        </button>

        <p className="note-text">
          * Authentication is simulated for academic implementation
        </p>
        {(role === "Donor" || role === "Beneficiary") && (
          <p className="note-text">
            Don't have an account?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onShowRegister?.(role.toUpperCase());
              }}
            >
              Sign up
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
