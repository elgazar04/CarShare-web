import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCar, faMapMarkerAlt, faDollarSign, faCalendarAlt, faGasPump, faCog, faUser, faArrowLeft, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import API from '../config/api';
import { useUser } from '../context/UserContext';
import CarInquiryForm from '../components/Chat/CarInquiryForm';

export default function CarDetails() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingMessage, setBookingMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    setLoading(true);
    axios.get(API.url(API.ENDPOINTS.CAR_DETAILS(id)))
      .then(response => {
        setCar(response.data);
        
        // If car owner data is incomplete, fetch owner details
        if (response.data && response.data.ownerId && (!response.data.carOwner || !response.data.carOwner.name)) {
          fetchOwnerInfo(response.data.ownerId);
        } else {
          setLoading(false);
        }
      })
      .catch(error => {
        console.error('Error fetching car details:', error);
        setError('Failed to load car details. Please try again later.');
        setLoading(false);
      });
  }, [id]);
  
  const fetchOwnerInfo = (ownerId) => {
    // Use the USER_BY_ID endpoint from our API configuration
    axios.get(API.url(API.ENDPOINTS.USER_BY_ID(ownerId)))
      .then(response => {
        setOwnerInfo(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching owner details:', error);
        setLoading(false);
      });
  };

  const handleBooking = () => {
    if (!user) {
      setBookingMessage({
        text: 'Please log in to book this car',
        type: 'warning'
      });
      return;
    }

    if (!startDate || !endDate) {
      setBookingMessage({
        text: 'Please select both start and end dates',
        type: 'warning'
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      setBookingMessage({
        text: 'End date must be after start date',
        type: 'warning'
      });
      return;
    }

    // Calculate total days and price
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalPrice = diffDays * car.pricePerDay;

    const bookingData = {
      carId: car.carId,
      startDate: startDate,
      endDate: endDate,
      totalPrice: totalPrice
    };

    setLoading(true);
    axios.post(API.url(API.ENDPOINTS.RENTALS), bookingData)
      .then(response => {
        setBookingMessage({
          text: 'Car booked successfully! Check your rentals page for details.',
          type: 'success'
        });
        setLoading(false);
      })
      .catch(error => {
        console.error('Error booking car:', error);
        setBookingMessage({
          text: error.response?.data?.message || 'Failed to book car. Please try again later.',
          type: 'danger'
        });
        setLoading(false);
      });
  };

  const calculateMinEndDate = () => {
    if (!startDate) return '';
    const minDate = new Date(startDate);
    minDate.setDate(minDate.getDate() + 1);
    return minDate.toISOString().split('T')[0];
  };

  if (loading && !car) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center" role="alert">
        {error}
      </div>
    );
  }

  if (!car) {
    return (
      <div className="alert alert-warning text-center" role="alert">
        Car not found
      </div>
    );
  }

  // Determine owner information - use ownerInfo if it was fetched separately
  const owner = ownerInfo || car.carOwner || {};
  const ownerName = owner.name || 'Unknown';
  const ownerContact = owner.email || 'No contact information';

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="container py-4">
      {/* Back button */}
      <button 
        className="btn btn-outline-secondary mb-4" 
        onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
        Back to Cars
      </button>

      {/* Car details */}
      <div className="row">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-danger fw-bold mb-3">{car.title}</h2>
              
              {/* Car image placeholder - you can replace with actual car image if available */}
              <div className="bg-light rounded mb-4" style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FontAwesomeIcon icon={faCar} style={{ fontSize: "8rem", opacity: 0.2 }} />
              </div>
              
              {/* Main details */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <h5>
                    <FontAwesomeIcon icon={faCar} className="text-danger me-2" />
                    Vehicle Details
                  </h5>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Brand:</span>
                      <span className="fw-bold">{car.brand}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Model:</span>
                      <span className="fw-bold">{car.model}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Year:</span>
                      <span className="fw-bold">{car.year}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Transmission:</span>
                      <span className="fw-bold">{car.transmission}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Status:</span>
                      <span className="fw-bold">
                        {car.rentalStatus === 'Available' ? (
                          <><FontAwesomeIcon icon={faCheckCircle} className="text-success me-1" /> Available</>
                        ) : (
                          <><FontAwesomeIcon icon={faTimesCircle} className="text-danger me-1" /> {car.rentalStatus || 'Not Available'}</>
                        )}
                      </span>
                    </li>
                  </ul>
                </div>
                
                <div className="col-md-6">
                  <h5>
                    <FontAwesomeIcon icon={faUser} className="text-danger me-2" />
                    Owner & Location
                  </h5>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Owner:</span>
                      <span className="fw-bold">{ownerName}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Contact:</span>
                      <span className="fw-bold">{ownerContact}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Location:</span>
                      <span className="fw-bold">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-muted me-1" />
                        {car.location}
                      </span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Price:</span>
                      <span className="fw-bold text-success">
                        <FontAwesomeIcon icon={faDollarSign} className="me-1" />
                        ${car.pricePerDay}/day
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Description */}
              <div className="mb-4">
                <h5>Description</h5>
                <p>{car.description || 'No description provided for this vehicle.'}</p>
              </div>
              
              {/* Add Car Inquiry Form */}
              {user && user.id !== car.ownerId && (
                <CarInquiryForm 
                  carId={car.carId} 
                  ownerId={car.ownerId} 
                  carTitle={car.title} 
                />
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          {/* Booking card */}
          <div className="card border-0 shadow-sm sticky-top" style={{ top: "20px" }}>
            <div className="card-header bg-danger text-white">
              <h4 className="my-2">Book This Car</h4>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="startDate" className="form-label">Start Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  id="startDate" 
                  min={today}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="endDate" className="form-label">End Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  id="endDate"
                  min={calculateMinEndDate()}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!startDate}
                />
              </div>
              
              {startDate && endDate && (
                <div className="alert alert-info">
                  <div className="d-flex justify-content-between">
                    <span>Daily Rate:</span>
                    <span>${car.pricePerDay}</span>
                  </div>
                  
                  {(() => {
                    if (!startDate || !endDate) return null;
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    if (start >= end) return null;
                    
                    const diffTime = Math.abs(end - start);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const totalPrice = diffDays * car.pricePerDay;
                    
                    return (
                      <>
                        <div className="d-flex justify-content-between">
                          <span>Total Days:</span>
                          <span>{diffDays}</span>
                        </div>
                        <div className="d-flex justify-content-between fw-bold">
                          <span>Total Price:</span>
                          <span>${totalPrice}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
              
              {bookingMessage.text && (
                <div className={`alert alert-${bookingMessage.type} mt-3`}>
                  {bookingMessage.text}
                </div>
              )}
              
              <button 
                className="btn btn-danger w-100 mt-3"
                onClick={handleBooking}
                disabled={!startDate || !endDate || loading || car.rentalStatus !== 'Available'}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  'Book Now'
                )}
              </button>
              
              {!user && (
                <div className="mt-3 text-center">
                  <small>
                    <a href="/login" className="text-danger">Login</a> or <a href="/register" className="text-danger">Register</a> to book this car
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
