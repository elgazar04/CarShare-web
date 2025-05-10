import { NavLink } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useChat } from '../context/ChatContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox, faEnvelope } from '@fortawesome/free-solid-svg-icons';

export default function Navbar() {
  const { user, logout } = useUser();
  const { unreadCount } = useChat();

  const role = user?.role;
  const isAdmin = role === "Admin";
  const isRenter = role === "Renter";
  const isCarOwner = role === "CarOwner";

  const handleLogout = () => {
    logout();
    window.location.href = "/Home"; // عند تسجيل الخروج، نعيد توجيه المستخدم إلى صفحة Login
  };

  return (
    <nav className="bg-danger py-2">
      <div className="container d-flex align-items-center">
        <span className="navbar-brand h1 text-black">CarRental</span>

        <ul className="d-flex flex-row ms-auto list-unstyled mb-0">
          {/* 🚗 Car Owner Links */}
          {isCarOwner && (
            <>
              <li className="me-5">
                <NavLink to="/CarOwner/CarOwnerHome" className="text-black text-decoration-none">Home</NavLink>
              </li>
              <li className="me-5">
                <NavLink to="/CarOwner/Proposals" className="text-black text-decoration-none">Proposals</NavLink>
              </li>
              <li className="me-5">
                <NavLink to="/CarOwner/ManageCarPosts" className="text-black text-decoration-none">Car Posts</NavLink>
              </li>
            </>
          )}

          {/* 🧑‍💼 Admin Links */}
          {isAdmin && (
            <>
              <li className="me-5">
                <NavLink to="/Admin/AdminDashboard" className="text-black text-decoration-none">Dashboard</NavLink>
              </li>
              <li className="me-5">
                <NavLink to="/Admin/ManageUsers" className="text-black text-decoration-none">Manage Users</NavLink>
              </li>
              <li className="me-5">
                <NavLink to="/Admin/ManagePosts" className="text-black text-decoration-none">Manage Posts</NavLink>
              </li>
            </>
          )}

          {/* 👤 Renter Links */}
          {isRenter && (
            <>
              <li className="me-5">
                <NavLink to="/Renter/RenterHome" className="text-black text-decoration-none">Home</NavLink>
              </li>
              <li className="me-5">
                <NavLink to="/CarsList" className="text-black text-decoration-none">Cars List</NavLink>
              </li>
            </>
          )}

          {/* 📨 Inbox Link for All Logged-in Users */}
          {user && (
            <li className="me-5">
              <NavLink to="/inbox" className="text-black text-decoration-none position-relative">
                <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                Inbox
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger text-white" style={{ fontSize: '0.65rem' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                    <span className="visually-hidden">unread messages</span>
                  </span>
                )}
              </NavLink>
            </li>
          )}

          {/* 🔐 Auth Buttons */}
          {user ? (
            <li className="me-5">
            <span
              role="button"
              className="text-black text-decoration-none"
              style={{ cursor: 'pointer' }}
              onClick={handleLogout}
            >
              Logout
            </span>
          </li>
          
          ) : (
            <>
              <li className="me-5">
                <NavLink to="/Home" className="text-black text-decoration-none">Home</NavLink>
              </li>

              <li className="me-5">
                <NavLink to="/Login" className="text-black text-decoration-none">Login</NavLink>
              </li>
              <li className="me-5">
                <NavLink to="/Register" className="text-black text-decoration-none">Register</NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
