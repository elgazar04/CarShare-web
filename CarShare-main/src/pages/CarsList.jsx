import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from '../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faCar, faMapMarkerAlt, faDollarSign, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

export default function CarsList() {
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTransmission, setSelectedTransmission] = useState('');
  
  // Get unique values for filter dropdowns
  const uniqueBrands = [...new Set(cars.map(car => car.brand))].filter(Boolean);
  const uniqueYears = [...new Set(cars.map(car => car.year))].filter(Boolean).sort((a, b) => b - a);
  const transmissionTypes = ['Automatic', 'Manual', 'Semi-Automatic'];

  useEffect(() => {
    setLoading(true);
    axios.get(API.url(API.ENDPOINTS.CARS))
      .then(response => {
        // Process cars data to ensure owner information
        const processedCars = response.data.map(car => {
          // If car has ownerId but no owner information, or incomplete owner info
          if (car.ownerId && (!car.carOwner || !car.carOwner.name)) {
            // For incomplete data, fetch owner details in a separate call
            fetchOwnerInfo(car);
          }
          return car;
        });
        
        setCars(processedCars);
        setFilteredCars(processedCars);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching cars:', error);
        setError('Failed to load cars. Please try again later.');
        setLoading(false);
      });
  }, []);
  
  const fetchOwnerInfo = (car) => {
    // Only make this call if we have an ownerId but missing owner info
    if (!car.ownerId) return;
    
    axios.get(API.url(API.ENDPOINTS.USER_BY_ID(car.ownerId)))
      .then(response => {
        // Update the specific car with owner info
        setCars(prevCars => 
          prevCars.map(c => 
            c.carId === car.carId ? { ...c, carOwner: response.data } : c
          )
        );
        setFilteredCars(prevCars => 
          prevCars.map(c => 
            c.carId === car.carId ? { ...c, carOwner: response.data } : c
          )
        );
      })
      .catch(error => {
        console.error(`Error fetching owner details for car ${car.carId}:`, error);
      });
  };

  useEffect(() => {
    // Apply filters whenever filter states change
    applyFilters();
  }, [searchTerm, minPrice, maxPrice, selectedBrand, selectedYear, selectedTransmission, cars]);

  const applyFilters = () => {
    let results = [...cars];
    
    // Search term filter (searches in title, brand, model)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(car => 
        (car.title && car.title.toLowerCase().includes(term)) ||
        (car.brand && car.brand.toLowerCase().includes(term)) ||
        (car.model && car.model.toLowerCase().includes(term))
      );
    }
    
    // Price range filter
    if (minPrice) {
      results = results.filter(car => car.pricePerDay >= Number(minPrice));
    }
    if (maxPrice) {
      results = results.filter(car => car.pricePerDay <= Number(maxPrice));
    }
    
    // Brand filter
    if (selectedBrand) {
      results = results.filter(car => car.brand === selectedBrand);
    }
    
    // Year filter
    if (selectedYear) {
      results = results.filter(car => car.year === Number(selectedYear));
    }
    
    // Transmission filter
    if (selectedTransmission) {
      results = results.filter(car => car.transmission === selectedTransmission);
    }
    
    setFilteredCars(results);
  };

  const handleViewDetails = (carId) => {
    navigate(`/cars/${carId}`);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedBrand('');
    setSelectedYear('');
    setSelectedTransmission('');
  };

  if (loading) {
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
        Browse All Cars
      </h2>

      {/* Search and Filter Section */}
      <div className="card bg-light shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            {/* Search input */}
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FontAwesomeIcon icon={faSearch} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by title, brand or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Brand dropdown */}
            <div className="col-md-3">
              <select 
                className="form-select" 
                value={selectedBrand} 
                onChange={(e) => setSelectedBrand(e.target.value)}>
                <option value="">All Brands</option>
                {uniqueBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Year dropdown */}
            <div className="col-md-3">
              <select 
                className="form-select" 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}>
                <option value="">All Years</option>
                {uniqueYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Price range */}
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FontAwesomeIcon icon={faDollarSign} />
                </span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Min Price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Max Price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Transmission dropdown */}
            <div className="col-md-4">
              <select 
                className="form-select" 
                value={selectedTransmission} 
                onChange={(e) => setSelectedTransmission(e.target.value)}>
                <option value="">All Transmissions</option>
                {transmissionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Reset filters button */}
            <div className="col-md-4">
              <button 
                className="btn btn-outline-secondary w-100" 
                onClick={resetFilters}>
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cars grid */}
      <div className="row">
        {filteredCars.length > 0 ? (
          filteredCars.map(car => (
            <div className="col-md-4 mb-4" key={car.carId}>
              <div className="card h-100 shadow-sm border-0 hover-card"
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
                <div className="card-body">
                  <h5 className="card-title text-danger fw-bold">{car.title}</h5>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-dark">
                      <FontAwesomeIcon icon={faCar} className="me-1" />
                      {car.brand} {car.model}
                    </span>
                    <span className="badge bg-secondary">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                      {car.year}
                    </span>
                  </div>
                  <div className="d-flex mb-3">
                    <div className="me-3">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-muted me-1" />
                      <small>{car.location}</small>
                    </div>
                    <div>
                      <FontAwesomeIcon icon={faDollarSign} className="text-success me-1" />
                      <small>${car.pricePerDay}/day</small>
                    </div>
                  </div>
                  <p className="card-text small">
                    <strong>Transmission:</strong> {car.transmission}<br />
                    <strong>Status:</strong> {car.rentalStatus || 'Available'}<br />
                    <strong>Owner:</strong> {car.carOwner ? car.carOwner.name || car.carOwner.firstName + ' ' + car.carOwner.lastName : (car.ownerName || 'Owner information loading...')}
                  </p>
                  <button 
                    className="btn btn-danger w-100" 
                    onClick={() => handleViewDetails(car.carId)}>
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5">
            <div className="alert alert-info">
              <h4>No cars match your search criteria</h4>
              <p>Try adjusting your filters or search term</p>
              <button className="btn btn-outline-primary mt-2" onClick={resetFilters}>
                Reset All Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
