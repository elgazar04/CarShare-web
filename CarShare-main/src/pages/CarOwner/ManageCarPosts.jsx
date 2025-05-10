import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCar, faPlus, faEdit, faTrash, faCheck, faTimes, faSearch, faInfoCircle, faList } from '@fortawesome/free-solid-svg-icons';
import API from '../../config/api';
import { useUser } from '../../context/UserContext';

export default function ManageCarPosts() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showRentalsModal, setShowRentalsModal] = useState(false);
  const [carRentals, setCarRentals] = useState([]);
  
  // For add/edit car form
  const [editMode, setEditMode] = useState(false);
  const [currentCar, setCurrentCar] = useState({
    title: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    pricePerDay: 0,
    transmission: 'Automatic',
    location: '',
    description: ''
  });
  
  const { user } = useUser();
  
  useEffect(() => {
    if (user) {
      fetchMyCars();
    }
  }, [user]);
  
  const fetchMyCars = async () => {
    try {
      setLoading(true);
      // The API endpoint should be updated to match your backend
      const response = await axios.get(`${API.BASE_URL}/Cars/my-cars`);
      setCars(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching my cars:', err);
      setError('Failed to load your cars. Please try again.');
      setLoading(false);
    }
  };
  
  const handleOpenAddModal = () => {
    setCurrentCar({
      title: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      pricePerDay: 0,
      transmission: 'Automatic',
      location: '',
      description: ''
    });
    setEditMode(false);
    setShowAddEditModal(true);
  };
  
  const handleOpenEditModal = (car) => {
    setCurrentCar({
      carId: car.carId,
      title: car.title || '',
      brand: car.brand || '',
      model: car.model || '',
      year: car.year || new Date().getFullYear(),
      pricePerDay: car.pricePerDay || 0,
      transmission: car.transmission || 'Automatic',
      location: car.location || '',
      description: car.description || ''
    });
    setEditMode(true);
    setShowAddEditModal(true);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCar(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'pricePerDay' ? Number(value) : value
    }));
  };
  
  const handleSubmitCar = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      let response;
      if (editMode) {
        // Update existing car
        response = await axios.put(API.url(API.ENDPOINTS.CAR_DETAILS(currentCar.carId)), currentCar);
        
        // Update local state
        setCars(cars.map(car => 
          car.carId === currentCar.carId ? { ...response.data } : car
        ));
        
        setMessage({ 
          text: 'Car updated successfully!', 
          type: 'success' 
        });
      } else {
        // Add new car
        response = await axios.post(API.url(API.ENDPOINTS.CARS), currentCar);
        
        // Add to local state
        setCars(prev => [...prev, response.data]);
        
        setMessage({ 
          text: 'Car added successfully! It will be available once approved by an admin.', 
          type: 'success' 
        });
      }
      
      setShowAddEditModal(false);
      setLoading(false);
    } catch (err) {
      console.error('Error saving car:', err);
      setMessage({ 
        text: `Failed to ${editMode ? 'update' : 'add'} car. Please try again.`, 
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
      await axios.delete(API.url(API.ENDPOINTS.CAR_DETAILS(carId)));
      
      // Update local state
      setCars(cars.filter(car => car.carId !== carId));
      
      setMessage({ 
        text: 'Car deleted successfully!', 
        type: 'success' 
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error deleting car:', err);
      setMessage({ 
        text: 'Failed to delete car. Please try again.', 
        type: 'danger' 
      });
      setLoading(false);
    }
  };
  
  const fetchCarRentals = async (carId) => {
    try {
      setLoading(true);
      // The API endpoint should be updated to match your backend
      const response = await axios.get(`${API.BASE_URL}/Rentals/car/${carId}`);
      setCarRentals(response.data);
      setShowRentalsModal(true);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching car rentals:', err);
      setMessage({ 
        text: 'Failed to load rental history for this car. Please try again.', 
        type: 'danger' 
      });
      setLoading(false);
    }
  };
  
  if (loading && cars.length === 0) {
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-uppercase fw-bold"
          style={{
            fontSize: "2.5rem",
            letterSpacing: "1px",
            borderBottom: "3px solid #dc3545",
            paddingBottom: "10px",
            color: "#212529"
          }}>
          <FontAwesomeIcon icon={faCar} className="me-2" />
          My Car Listings
        </h2>
        
        <button className="btn btn-success" onClick={handleOpenAddModal}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Add New Car
        </button>
      </div>
      
      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ text: '', type: '' })}></button>
        </div>
      )}
      
      {error && cars.length === 0 ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : cars.length === 0 ? (
        <div className="alert alert-info text-center p-5" role="alert">
          <FontAwesomeIcon icon={faInfoCircle} className="me-2" style={{ fontSize: '3rem' }} />
          <h4 className="mt-3">You don't have any car listings yet</h4>
          <p className="text-muted mb-4">Start by adding your first car to rent out</p>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Your First Car
          </button>
        </div>
      ) : (
        <div className="row">
          {cars.map(car => (
            <div className="col-md-4 mb-4" key={car.carId}>
              <div className="card h-100 shadow-sm hover-card"
                style={{
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0,0,0,0.075)';
                }}
              >
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span className={`badge ${car.isApproved ? 'bg-success' : 'bg-warning'}`}>
                    {car.isApproved ? 'Approved' : 'Pending Approval'}
                  </span>
                  <span className={`badge ${
                    car.rentalStatus === 'Available' ? 'bg-info' : 
                    car.rentalStatus === 'Rented' ? 'bg-danger' : 'bg-secondary'
                  }`}>
                    {car.rentalStatus || 'Status Unknown'}
                  </span>
                </div>
                
                <div className="card-body">
                  <h5 className="card-title text-primary">{car.title}</h5>
                  <p className="card-text text-muted">
                    {car.brand} {car.model} ({car.year})
                  </p>
                  
                  <ul className="list-group list-group-flush mb-3">
                    <li className="list-group-item d-flex justify-content-between py-2">
                      <span>Price per day:</span>
                      <span className="fw-bold">${car.pricePerDay}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between py-2">
                      <span>Location:</span>
                      <span>{car.location}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between py-2">
                      <span>Transmission:</span>
                      <span>{car.transmission}</span>
                    </li>
                  </ul>
                  
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleOpenEditModal(car)}>
                      <FontAwesomeIcon icon={faEdit} className="me-2" />
                      Edit
                    </button>
                    
                    <button 
                      className="btn btn-sm btn-outline-info"
                      onClick={() => fetchCarRentals(car.carId)}>
                      <FontAwesomeIcon icon={faList} className="me-2" />
                      View Rentals
                    </button>
                    
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteCar(car.carId)}>
                      <FontAwesomeIcon icon={faTrash} className="me-2" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Add/Edit Car Modal */}
      {showAddEditModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editMode ? 'Edit Car' : 'Add New Car'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddEditModal(false)}></button>
              </div>
              <form onSubmit={handleSubmitCar}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label htmlFor="title" className="form-label">Title</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="title"
                        name="title"
                        value={currentCar.title}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-md-4">
                      <label htmlFor="brand" className="form-label">Brand</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="brand"
                        name="brand"
                        value={currentCar.brand}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-md-4">
                      <label htmlFor="model" className="form-label">Model</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="model"
                        name="model"
                        value={currentCar.model}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-md-4">
                      <label htmlFor="year" className="form-label">Year</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        id="year"
                        name="year"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={currentCar.year}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="pricePerDay" className="form-label">Price Per Day ($)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        id="pricePerDay"
                        name="pricePerDay"
                        min="0"
                        step="0.01"
                        value={currentCar.pricePerDay}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="transmission" className="form-label">Transmission</label>
                      <select 
                        className="form-select" 
                        id="transmission"
                        name="transmission"
                        value={currentCar.transmission}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Automatic">Automatic</option>
                        <option value="Manual">Manual</option>
                        <option value="Semi-Automatic">Semi-Automatic</option>
                      </select>
                    </div>
                    
                    <div className="col-12">
                      <label htmlFor="location" className="form-label">Location</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="location"
                        name="location"
                        value={currentCar.location}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-12">
                      <label htmlFor="description" className="form-label">Description</label>
                      <textarea 
                        className="form-control" 
                        id="description"
                        name="description"
                        rows="3"
                        value={currentCar.description}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>Save Car</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Car Rentals Modal */}
      {showRentalsModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Rental History</h5>
                <button type="button" className="btn-close" onClick={() => setShowRentalsModal(false)}></button>
              </div>
              <div className="modal-body">
                {carRentals.length === 0 ? (
                  <div className="text-center p-4">
                    <p className="mb-0">No rental history found for this car.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Renter</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Total Price</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {carRentals.map(rental => (
                          <tr key={rental.rentalId}>
                            <td>{rental.renter?.name || 'Unknown'}</td>
                            <td>{new Date(rental.startDate).toLocaleDateString()}</td>
                            <td>{new Date(rental.endDate).toLocaleDateString()}</td>
                            <td>${rental.totalPrice}</td>
                            <td>
                              <span className={`badge ${
                                rental.status === 'Completed' ? 'bg-success' :
                                rental.status === 'Active' ? 'bg-primary' :
                                rental.status === 'Upcoming' ? 'bg-info' :
                                rental.status === 'Cancelled' ? 'bg-danger' :
                                'bg-secondary'
                              }`}>
                                {rental.status || 'Unknown'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRentalsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
