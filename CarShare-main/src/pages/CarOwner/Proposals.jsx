import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faCheck, faTimes, faInfoCircle, faCalendarAlt, faCar, faUser, faMoneyBill, faClock, faFilter, faSearch, faComments } from '@fortawesome/free-solid-svg-icons';
import API from '../../config/api';

export default function Proposals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedRental, setSelectedRental] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  useEffect(() => {
    fetchRentals();
  }, []);
  
  const fetchRentals = async () => {
    try {
      setLoading(true);
      // The API endpoint should be updated to match your backend
      const response = await axios.get(`${API.BASE_URL}/Rentals/owner`);
      setRentals(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching rentals:', err);
      setError('Failed to load rental requests. Please try again.');
      setLoading(false);
    }
  };
  
  const handleApproveReject = async (rentalId, isApproved) => {
    try {
      setLoading(true);
      // The API endpoint should be updated to match your backend
      await axios.put(`${API.BASE_URL}/Rentals/${rentalId}/status`, { 
        status: isApproved ? 'Approved' : 'Rejected' 
      });
      
      // Update local state
      setRentals(rentals.map(rental => 
        rental.rentalId === rentalId ? { 
          ...rental, 
          status: isApproved ? 'Approved' : 'Rejected' 
        } : rental
      ));
      
      setMessage({ 
        text: `Rental request ${isApproved ? 'approved' : 'rejected'} successfully!`, 
        type: 'success' 
      });
      
      if (selectedRental && selectedRental.rentalId === rentalId) {
        setSelectedRental({
          ...selectedRental,
          status: isApproved ? 'Approved' : 'Rejected'
        });
      }
      
      setLoading(false);
    } catch (err) {
      console.error(`Error ${isApproved ? 'approving' : 'rejecting'} rental:`, err);
      setMessage({ 
        text: `Failed to ${isApproved ? 'approve' : 'reject'} rental request. Please try again.`, 
        type: 'danger' 
      });
      setLoading(false);
    }
  };
  
  const handleShowDetails = (rental) => {
    setSelectedRental(rental);
    setShowDetailsModal(true);
  };
  
  // Apply filter
  const filteredRentals = filterStatus 
    ? rentals.filter(rental => rental.status === filterStatus)
    : rentals;
  
  const calculateRentalDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-warning';
      case 'Approved':
        return 'bg-success';
      case 'Rejected':
        return 'bg-danger';
      case 'Completed':
        return 'bg-info';
      case 'Cancelled':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  };
  
  if (loading && rentals.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
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
        <FontAwesomeIcon icon={faList} className="me-2" />
        Rental Requests
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
          <div className="row align-items-center">
            <div className="col-md-6">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faFilter} className="me-2" />
                Filter Requests
              </h5>
            </div>
            <div className="col-md-6">
              <select 
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Requests</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : filteredRentals.length === 0 ? (
        <div className="alert alert-info text-center p-5" role="alert">
          <FontAwesomeIcon icon={faInfoCircle} className="me-2" style={{ fontSize: '3rem' }} />
          <h4 className="mt-3">No rental requests found</h4>
          <p className="text-muted mb-0">
            {filterStatus 
              ? `No ${filterStatus.toLowerCase()} rental requests found` 
              : 'You don\'t have any rental requests yet'}
          </p>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Car</th>
                    <th>Renter</th>
                    <th>Dates</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRentals.map(rental => (
                    <tr key={rental.rentalId}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded p-2 me-3">
                            <FontAwesomeIcon icon={faCar} className="text-primary" />
                          </div>
                          <div>
                            <div className="fw-bold">{rental.car?.title || 'Unknown Car'}</div>
                            <small className="text-muted">
                              {rental.car?.brand} {rental.car?.model}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded-circle p-2 me-2">
                            <FontAwesomeIcon icon={faUser} />
                          </div>
                          <span>{rental.renter?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div>
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-muted me-1" />
                            {new Date(rental.startDate).toLocaleDateString()} to {new Date(rental.endDate).toLocaleDateString()}
                          </div>
                          <div className="text-muted">
                            <FontAwesomeIcon icon={faClock} className="me-1" />
                            {calculateRentalDuration(rental.startDate, rental.endDate)} days
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="fw-bold text-success">
                          <FontAwesomeIcon icon={faMoneyBill} className="me-1" />
                          ${rental.totalPrice}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(rental.status)}`}>
                          {rental.status || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => handleShowDetails(rental)}
                            title="View Details"
                          >
                            <FontAwesomeIcon icon={faInfoCircle} />
                          </button>
                          
                          {rental.status === 'Pending' && (
                            <>
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleApproveReject(rental.rentalId, true)}
                                title="Approve Request"
                              >
                                <FontAwesomeIcon icon={faCheck} />
                              </button>
                              
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleApproveReject(rental.rentalId, false)}
                                title="Reject Request"
                              >
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                            </>
                          )}
                          
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => console.log('Open chat with renter')}
                            title="Chat with Renter"
                          >
                            <FontAwesomeIcon icon={faComments} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Rental Details Modal */}
      {showDetailsModal && selectedRental && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Rental Request Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h5>Car Information</h5>
                    <ul className="list-group list-group-flush mb-4">
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Car:</span>
                        <span className="fw-bold">{selectedRental.car?.title}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Brand/Model:</span>
                        <span>{selectedRental.car?.brand} {selectedRental.car?.model}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Year:</span>
                        <span>{selectedRental.car?.year}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Price Per Day:</span>
                        <span className="text-success">${selectedRental.car?.pricePerDay}</span>
                      </li>
                    </ul>
                    
                    <h5>Renter Information</h5>
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Name:</span>
                        <span>{selectedRental.renter?.name}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Email:</span>
                        <span>{selectedRental.renter?.email}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Phone:</span>
                        <span>{selectedRental.renter?.phone || 'Not provided'}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="col-md-6">
                    <h5>Rental Details</h5>
                    <div className="alert alert-info mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Status:</span>
                        <span className={`badge ${getStatusBadgeClass(selectedRental.status)}`}>
                          {selectedRental.status}
                        </span>
                      </div>
                    </div>
                    
                    <ul className="list-group list-group-flush mb-4">
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Start Date:</span>
                        <span>{new Date(selectedRental.startDate).toLocaleDateString()}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>End Date:</span>
                        <span>{new Date(selectedRental.endDate).toLocaleDateString()}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Duration:</span>
                        <span>{calculateRentalDuration(selectedRental.startDate, selectedRental.endDate)} days</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Total Price:</span>
                        <span className="fw-bold text-success">${selectedRental.totalPrice}</span>
                      </li>
                      {selectedRental.dateRequested && (
                        <li className="list-group-item d-flex justify-content-between">
                          <span>Date Requested:</span>
                          <span>{new Date(selectedRental.dateRequested).toLocaleDateString()}</span>
                        </li>
                      )}
                    </ul>
                    
                    {selectedRental.notes && (
                      <div className="mb-3">
                        <h6>Notes from Renter:</h6>
                        <p className="p-3 bg-light rounded">{selectedRental.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                {selectedRental.status === 'Pending' && (
                  <>
                    <button 
                      className="btn btn-success"
                      onClick={() => {
                        handleApproveReject(selectedRental.rentalId, true);
                        setShowDetailsModal(false);
                      }}>
                      <FontAwesomeIcon icon={faCheck} className="me-2" />
                      Approve Request
                    </button>
                    
                    <button 
                      className="btn btn-danger"
                      onClick={() => {
                        handleApproveReject(selectedRental.rentalId, false);
                        setShowDetailsModal(false);
                      }}>
                      <FontAwesomeIcon icon={faTimes} className="me-2" />
                      Reject Request
                    </button>
                  </>
                )}
                <button 
                  className="btn btn-primary"
                  onClick={() => console.log('Open chat with renter')}>
                  <FontAwesomeIcon icon={faComments} className="me-2" />
                  Contact Renter
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDetailsModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
