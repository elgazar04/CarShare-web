// ./pages/Admin/AdminDashboard.jsx
import { useNavigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './AdminDashboard.css' // هنضيف ملف CSS خارجي لو عايزة مزيد من التحكم

function AdminDashboard() {
  const navigate = useNavigate()

  return (
    <div className="container py-5">
        <div className="container py-5 d-flex justify-content-center">
  <h2
    className="text-uppercase fw-bold text-dark text-center"
    style={{
      fontSize: "2.5rem",
      letterSpacing: "1px",
      borderBottom: "3px solid #dc3545",
      paddingBottom: "10px",
    }}
  >
    Admin Dashboard
  </h2>
</div>



      <div className="row justify-content-center gap-4">
        {/* Manage Users Card */}
        <div className="col-md-5 mb-4">
          <div className="card admin-card text-white bg-dark h-100 shadow-lg">
            <div className="card-body text-center d-flex flex-column justify-content-center">
              <i className="fas fa-users fa-3x mb-4 text-danger"></i>
              <h4 className="card-title mb-3">Manage Users</h4>
              <p className="card-text mb-4">View and control user accounts in the platform.</p>
              <button
                className="btn btn-danger btn-lg"
                onClick={() => navigate('/Admin/ManageUsers')}
              >
                Manage Users
              </button>
            </div>
          </div>
        </div>

        {/* Manage Posts Card */}
        <div className="col-md-5 mb-4">
          <div className="card admin-card text-white bg-dark h-100 shadow-lg">
            <div className="card-body text-center d-flex flex-column justify-content-center">
              <i className="fas fa-car fa-3x mb-4 text-danger"></i>
              <h4 className="card-title mb-3">Manage Posts</h4>
              <p className="card-text mb-4">Review and manage car rental posts.</p>
              <button
                className="btn btn-danger btn-lg"
                onClick={() => navigate('/Admin/ManagePosts')}
              >
                Manage Posts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
