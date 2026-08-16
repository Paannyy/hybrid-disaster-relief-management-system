export default function DonorNavbar({ setView }) {
  const isLoggedIn = Boolean(localStorage.getItem("TOKEN"));

  const handleLogout = () => {
    localStorage.removeItem("TOKEN");
    localStorage.removeItem("ROLE");
    window.location.reload();
  };

  return (
    <div className="donor-navbar">
      <h2 className="logo">DisasterRelief</h2>

      <ul>
        <li onClick={() => setView("home")}>Home</li>
        <li onClick={() => setView("emergencies")}>Emergencies</li>

        <li className="dropdown">
          Donate Money
          <div className="dropdown-menu">
            <p onClick={() => setView("donate")}>Add Money</p>
            <p onClick={() => setView("transactions")}>Status</p>
            <p onClick={() => setView("transactions")}>Transactions</p>
          </div>
        </li>

        <li onClick={() => setView("home")}>About Us</li>
        {isLoggedIn ? (
          <li className="logout" onClick={handleLogout}>Logout</li>
        ) : (
          <li onClick={() => window.location.reload()}>Sign In</li>
        )}
      </ul>
    </div>
  );
}
