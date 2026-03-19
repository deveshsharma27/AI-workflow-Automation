import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import "../styles/navbar.css";

function UserPanel() {

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleGuestClick = () => {
    navigate("/login");
  };

  const handleUserClick = () => {
    navigate("/settings");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="user-panel">

      <span
        className="user-name"
        onClick={user ? handleUserClick : handleGuestClick}
      >
        {user ? user.name : "Guest"}
      </span>

      {user && (
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      )}

    </div>
  );
}

export default UserPanel;