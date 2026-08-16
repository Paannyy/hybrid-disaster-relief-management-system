export default function AdminNavbar({ setView }) {
  const handleLogout = () => {
    localStorage.removeItem("TOKEN");
    localStorage.removeItem("ROLE");
    window.location.reload();
  };

  return (
    <div className="admin-navbar">
      <h2 className="logo">Admin Panel</h2>

      <ul>
        <li onClick={() => setView("home")}>Dashboard</li>
        <li onClick={() => setView("beneficiary")}>Beneficiaries</li>
        <li onClick={() => setView("donations")}>Donations</li>
        <li onClick={() => setView("aid")}>Aid</li>
        <li onClick={() => setView("proof")}>Proof</li>
        <li onClick={() => setView("emergency")}>Add Emergency</li>

        <li className="logout" onClick={handleLogout}>
          Logout
        </li>
      </ul>
    </div>
  );
}
