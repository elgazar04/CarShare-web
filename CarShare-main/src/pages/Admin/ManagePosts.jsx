import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCar, faFilter, faSearch, faCheck, faTimes, faTrash, faEye, faEdit, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import API from '../../config/api';

export default function ManagePosts() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // For car details modal
  const [selectedCar, setSelectedCar] = useState(null);
  const [showCarDetailsModal, setShowCarDetailsModal] = useState(false);
  
  useEffect(() => {
    fetchCars();
  }, []);
  
  const fetchCars = async () => {
    try {
      setLoading(true);
      // The API endpoint should be updated to match your backend
      const response = await axios.get(API.url(API.ENDPOINTS.CARS));
      setCars(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError('Failed to load cars. Please try again.');
      setLoading(false);
    }
  };
  
  const handleApproveReject = async (carId, isApproved) => {
    try {
      setLoading(true);
      // The API endpoint should be updated to match your backend
      await axios.put(API.url(API.ENDPOINTS.APPROVE_CAR(carId)), { isApproved });
      
      // Update local state
      setCars(cars.map(car => 
        car.carId === carId ? { ...car, isApproved } : car
      ));
      
      setMessage({ 
        text: `Car ${isApproved ? 'approved' : 'rejected'} successfully!`, 
        type: 'success' 
      });
      
      setLoading(false);
    } catch (err) {
      console.error(`Error ${isApproved ? 'approving' : 'rejecting'} car:`, err);
      setMessage({ 
        text: `Failed to ${isApproved ? 'approve' : 'reject'} car. Please try again.`, 
        type: 'danger' 
      });
      setLoading(false);
    }
  };
  
  const handleDeleteCar = async (carId) => {
    if (!window.confirm('Are you sure you want to delete this car listing? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      // The API endpoint should be updated to match your backend
      await axios.delete(API.url(API.ENDPOINTS.CAR_DETAILS(carId)));
      
      // Update local state
      setCars(cars.filter(car => car.carId !== carId));
      
      setMessage({ 
        text: 'Car listing deleted successfully!', 
        type: 'success' 
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error deleting car:', err);
      setMessage({ 
        text: 'Failed to delete car listing. Please try again.', 
        type: 'danger' 
      });
      setLoading(false);
    }
  };
  
  const openCarDetailsModal = (car) => {
    setSelectedCar(car);
    setShowCarDetailsModal(true);
  };
  
  // Apply filters
  const filteredCars = cars.filter(car => {
    const matchesSearch = 
      (car.title && car.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (car.description && car.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (car.brand && car.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (car.model && car.model.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === '' ? true : 
      statusFilter === 'Approved' ? car.isApproved === true :
      statusFilter === 'Pending' ? car.isApproved === false :
      statusFilter === 'Available' ? car.rentalStatus === 'Available' :
      statusFilter === 'Rented' ? car.rentalStatus === 'Rented' : true;
    
    const matchesBrand = brandFilter === '' ? true : car.brand === brandFilter;
    
    return matchesSearch && matchesStatus && matchesBrand;
  });
  
  // Get unique brands for filter dropdown
  const uniqueBrands = [...new Set(cars.filter(car => car.brand).map(car => car.brand))];
  
  if (loading && cars.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (error && cars.length === 0) {
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
        <FontAwesomeIcon icon={faCar} className="me-2" />
        Manage Car Listings
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
                  placeholder="Search by title, brand, model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="col-md-3">
              <select 
                className="form-select" 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending Approval</option>
                <option value="Available">Available</option>
                <option value="Rented">Rented</option>
              </select>
            </div>
            
            <div className="col-md-3">
              <select 
                className="form-select" 
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}>
                <option value="">All Brands</option>
                {uniqueBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cars Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th scope="col">Car</th>
                  <th scope="col">Owner</th>
                  <th scope="col">Price/Day</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCars.length > 0 ? (
                  filteredCars.map(car => (
                    <tr key={car.carId}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded p-2 me-3 text-center" style={{ width: 50, height: 50 }}>
                            <FontAwesomeIcon icon={faCar} style={{ fontSize: '1.5rem' }} />
                          </div>
                          <div>
                            <div className="fw-bold">{car.title}</div>
                            <small className="text-muted">{car.brand} {car.model} ({car.year})</small>
                          </div>
                        </div>
                      </td>
                      <td>{car.carOwner?.name || 'Unknown Owner'}</td>
                      <td>${car.pricePerDay}</td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className={`badge ${car.isApproved ? 'bg-success' : 'bg-warning'} mb-1`}>
                            {car.isApproved ? 'Approved' : 'Pending Approval'}
                          </span>
                          <span className={`badge ${car.rentalStatus === 'Available' ? 'bg-info' : 'bg-secondary'}`}>
                            {car.rentalStatus || 'Status Unknown'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => openCarDetailsModal(car)}
                            title="View Details"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          
                          {!car.isApproved && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleApproveReject(car.carId, true)}
                              title="Approve Car"
                            >
                              <FontAwesomeIcon icon={faCheck} />
                            </button>
                          )}
                          
                          {car.isApproved && (
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => handleApproveReject(car.carId, false)}
                              title="Revoke Approval"
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          )}
                          
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteCar(car.carId)}
                            title="Delete Car"
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
                      No cars found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Car Details Modal */}
      {showCarDetailsModal && selectedCar && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Car Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowCarDetailsModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h4>{selectedCar.title}</h4>
                    <p className="text-muted">{selectedCar.brand} {selectedCar.model} ({selectedCar.year})</p>
                    
                    <h5 className="mt-4">Details</h5>
                    <ul className="list-group list-group-flush mb-3">
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Price per day:</span>
                        <span className="fw-bold">${selectedCar.pricePerDay}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Transmission:</span>
                        <span>{selectedCar.transmission}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Location:</span>
                        <span>{selectedCar.location}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Owner:</span>
                        <span>{selectedCar.carOwner?.name || 'Unknown'}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Owner Email:</span>
                        <span>{selectedCar.carOwner?.email || 'Unknown'}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="alert alert-info">
                      <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                      Status Information
                    </div>
                    
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Approval Status:</span>
                        <span className={`badge ${selectedCar.isApproved ? 'bg-success' : 'bg-warning'}`}>
                          {selectedCar.isApproved ? 'Approved' : 'Pending Approval'}
                        </span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Rental Status:</span>
                        <span className={`badge ${selectedCar.rentalStatus === 'Available' ? 'bg-info' : 'bg-secondary'}`}>
                          {selectedCar.rentalStatus || 'Status Unknown'}
                        </span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Date Added:</span>
                        <span>{new Date(selectedCar.dateAdded || Date.now()).toLocaleDateString()}</span>
                      </li>
                    </ul>
                    
                    {selectedCar.description && (
                      <div className="mt-3">
                        <h5>Description</h5>
                        <p>{selectedCar.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <div className="d-flex w-100 justify-content-between">
                  <button 
                    className="btn btn-danger" 
                    onClick={() => {
                      setShowCarDetailsModal(false);
                      handleDeleteCar(selectedCar.carId);
                    }}>
                    Delete Car
                  </button>
                  
                  <div>
                    <button type="button" className="btn btn-secondary me-2" onClick={() => setShowCarDetailsModal(false)}>
                      Close
                    </button>
                    
                    {!selectedCar.isApproved ? (
                      <button 
                        className="btn btn-success" 
                        onClick={() => {
                          handleApproveReject(selectedCar.carId, true);
                          setShowCarDetailsModal(false);
                        }}>
                        Approve Car
                      </button>
                    ) : (
                      <button 
                        className="btn btn-warning" 
                        onClick={() => {
                          handleApproveReject(selectedCar.carId, false);
                          setShowCarDetailsModal(false);
                        }}>
                        Revoke Approval
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
