import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faUserShield, faCar, faSearch, faCheck, faTimes, faEdit, faTrash, faKey } from '@fortawesome/free-solid-svg-icons';
import API from '../../config/api';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // For role changing modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('');
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // The API endpoint should be updated to match your backend
      const response = await axios.get(`${API.BASE_URL}/Users/all`);
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      setLoading(false);
    }
  };
  
  const handleActivateDeactivate = async (userId, currentStatus) => {
    try {
      setLoading(true);
      // The API endpoint should be updated to match your backend
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      await axios.put(`${API.BASE_URL}/Users/${userId}/status`, { status: newStatus });
      
      // Update local state
      setUsers(users.map(user => 
        user.userId === userId ? { ...user, status: newStatus } : user
      ));
      
      setMessage({ 
        text: `User ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully!`, 
        type: 'success' 
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error updating user status:', err);
      setMessage({ 
        text: 'Failed to update user status. Please try again.', 
        type: 'danger' 
      });
      setLoading(false);
    }
  };
  
  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };
  
  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    
    try {
      setLoading(true);
      // The API endpoint should be updated to match your backend
      await axios.put(`${API.BASE_URL}/Users/${selectedUser.userId}/role`, { role: newRole });
      
      // Update local state
      setUsers(users.map(user => 
        user.userId === selectedUser.userId ? { ...user, role: newRole } : user
      ));
      
      setMessage({ 
        text: `User role changed to ${newRole} successfully!`, 
        type: 'success' 
      });
      
      setShowRoleModal(false);
      setLoading(false);
    } catch (err) {
      console.error('Error changing user role:', err);
      setMessage({ 
        text: 'Failed to change user role. Please try again.', 
        type: 'danger' 
      });
      setLoading(false);
    }
  };
  
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      // The API endpoint should be updated to match your backend
      await axios.delete(`${API.BASE_URL}/Users/${userId}`);
      
      // Update local state
      setUsers(users.filter(user => user.userId !== userId));
      
      setMessage({ 
        text: 'User deleted successfully!', 
        type: 'success' 
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error deleting user:', err);
      setMessage({ 
        text: 'Failed to delete user. Please try again.', 
        type: 'danger' 
      });
      setLoading(false);
    }
  };
  
  // Apply filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    const matchesStatus = statusFilter ? user.status === statusFilter : true;
    
    return matchesSearch && matchesRole && matchesStatus;
  });
  
  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin':
        return <FontAwesomeIcon icon={faUserShield} className="text-danger" />;
      case 'CarOwner':
        return <FontAwesomeIcon icon={faCar} className="text-primary" />;
      default:
        return <FontAwesomeIcon icon={faUser} className="text-secondary" />;
    }
  };
  
  if (loading && users.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (error && users.length === 0) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }
  
  return (
    <div className="container py-4">
      <h2 className="text-uppercase fw-bold text-center mb-4"
        style={{
          fontSize: "2.5rem",
          letterSpacing: "1px",
          borderBottom: "3px solid #dc3545",
          paddingBottom: "10px",
          color: "#212529"
        }}>
        <FontAwesomeIcon icon={faUserShield} className="me-2" />
        Manage Users
      </h2>
      
      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ text: '', type: '' })}></button>
        </div>
      )}
      
      {/* Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FontAwesomeIcon icon={faSearch} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="col-md-3">
              <select 
                className="form-select" 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="CarOwner">Car Owner</option>
                <option value="Renter">Renter</option>
              </select>
            </div>
            
            <div className="col-md-3">
              <select 
                className="form-select" 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Users Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th scope="col">User</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <tr key={user.userId}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded-circle p-2 me-2">
                            {getRoleIcon(user.role)}
                          </div>
                          <div>
                            <div className="fw-bold">{user.name}</div>
                            <small className="text-muted">ID: {user.userId}</small>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${
                          user.role === 'Admin' ? 'bg-danger' : 
                          user.role === 'CarOwner' ? 'bg-primary' : 
                          'bg-secondary'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                          {user.status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className={`btn btn-sm ${user.status === 'Active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            onClick={() => handleActivateDeactivate(user.userId, user.status || 'Active')}
                            title={user.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                          >
                            <FontAwesomeIcon icon={user.status === 'Active' ? faTimes : faCheck} />
                          </button>
                          
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openRoleModal(user)}
                            title="Change Role"
                          >
                            <FontAwesomeIcon icon={faKey} />
                          </button>
                          
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteUser(user.userId)}
                            title="Delete User"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No users found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change User Role</h5>
                <button type="button" className="btn-close" onClick={() => setShowRoleModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Change role for user: <strong>{selectedUser.name}</strong></p>
                <select 
                  className="form-select" 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}>
                  <option value="Admin">Admin</option>
                  <option value="CarOwner">Car Owner</option>
                  <option value="Renter">Renter</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleRoleChange}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
