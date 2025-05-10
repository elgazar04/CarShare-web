import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCar, faMoneyBill, faUsers, faCalendarAlt, faList, 
  faPlus, faChartLine, faBell, faCheck, faArrowRight, 
  faEnvelope, faStar, faShieldAlt, faClock, faInfoCircle, faBolt, faCamera,
  faSearch, faFilter, faEye
} from '@fortawesome/free-solid-svg-icons';
import API from '../../config/api';
import { useUser } from '../../context/UserContext';

export default function CarOwnerHome() {
  const [stats, setStats] = useState({
    totalCars: 0,
    approvedCars: 0,
    totalRentals: 0,
    activeRentals: 0,
    totalEarnings: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [otherCars, setOtherCars] = useState([]);
  const [loadingOtherCars, setLoadingOtherCars] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [carFilters, setCarFilters] = useState({
    priceRange: { min: 0, max: 1000 },
    make: 'all',
    sortBy: 'price-asc'
  });
  const [filteredCars, setFilteredCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [showCarModal, setShowCarModal] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchOtherCars();
    }
  }, [user]);

  // Apply filters to the cars
  useEffect(() => {
    if (otherCars.length > 0) {
      let result = [...otherCars];
      
      // Apply search term filter
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        result = result.filter(car => 
          car.title?.toLowerCase().includes(search) || 
          car.make?.toLowerCase().includes(search) || 
          car.model?.toLowerCase().includes(search) ||
          car.description?.toLowerCase().includes(search)
        );
      }
      
      // Apply price range filter
      result = result.filter(car => 
        car.price >= carFilters.priceRange.min && 
        car.price <= carFilters.priceRange.max
      );
      
      // Apply make filter
      if (carFilters.make !== 'all') {
        result = result.filter(car => 
          car.make?.toLowerCase() === carFilters.make.toLowerCase()
        );
      }
      
      // Apply sorting
      switch (carFilters.sortBy) {
        case 'price-asc':
          result.sort((a, b) => (a.price || 0) - (b.price || 0));
          break;
        case 'price-desc':
          result.sort((a, b) => (b.price || 0) - (a.price || 0));
          break;
        case 'newest':
          result.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
          break;
        default:
          break;
      }
      
      setFilteredCars(result);
    } else {
      setFilteredCars([]);
    }
  }, [otherCars, searchTerm, carFilters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // In a real application, these would be actual API calls
      // For now, we'll simulate the data
      
      // Fetch car owner's cars
      const carsResponse = await axios.get(`${API.BASE_URL}/Cars/my-cars`);
      const cars = carsResponse.data || [];
      
      // Fetch car owner's rentals
      const rentalsResponse = await axios.get(`${API.BASE_URL}/Rentals/owner`);
      const rentals = rentalsResponse.data || [];
      
      // Calculate statistics
      const approvedCars = cars.filter(car => car.isApproved).length;
      const activeRentals = rentals.filter(rental => 
        rental.status === 'Active' || rental.status === 'Upcoming'
      ).length;
      
      // Calculate total earnings
      const totalEarnings = rentals.reduce((sum, rental) => {
        return rental.status === 'Completed' ? sum + rental.totalPrice : sum;
      }, 0);
      
      // Get recent activity (combine recent rentals and car approvals)
      const recentActivity = [
        ...rentals.slice(0, 5).map(rental => ({
          type: 'rental',
          date: new Date(rental.startDate),
          title: `New rental for ${rental.car?.title || 'your car'}`,
          details: `${rental.renter?.name || 'A renter'} booked your car from ${new Date(rental.startDate).toLocaleDateString()} to ${new Date(rental.endDate).toLocaleDateString()}`
        })),
        ...cars.filter(car => car.isApproved).slice(0, 3).map(car => ({
          type: 'approval',
          date: new Date(car.dateAdded || Date.now()),
          title: `Car approved: ${car.title}`,
          details: `Your car listing has been approved and is now visible to renters`
        }))
      ].sort((a, b) => b.date - a.date).slice(0, 5);
      
      setStats({
        totalCars: cars.length,
        approvedCars,
        totalRentals: rentals.length,
        activeRentals,
        totalEarnings,
        recentActivity
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
    }
  };

  const fetchOtherCars = async () => {
    try {
      setLoadingOtherCars(true);
      
      // Fetch all approved cars from the API
      const response = await axios.get(`${API.BASE_URL}/Cars/approved`);
      const allCars = response.data || [];
      
      // Fetch the current user's cars to filter them out
      const myCarsResponse = await axios.get(`${API.BASE_URL}/Cars/my-cars`);
      const myCars = myCarsResponse.data || [];
      
      // Extract the IDs of the user's own cars
      const myCarIds = myCars.map(car => car.id);
      
      // Filter out the user's own cars
      const filteredCars = allCars.filter(car => !myCarIds.includes(car.id));
      
      setOtherCars(filteredCars);
      setLoadingOtherCars(false);
    } catch (err) {
      console.error('Error fetching other cars:', err);
      setLoadingOtherCars(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Function to handle viewing car details
  const handleViewCarDetails = (car) => {
    setSelectedCar(car);
    setShowCarModal(true);
  };

  // Function to close the car details modal
  const handleCloseCarModal = () => {
    setShowCarModal(false);
    // Clear the selected car after animation completes
    setTimeout(() => setSelectedCar(null), 300);
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
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Welcome Banner */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-gradient-primary text-white border-0 overflow-hidden" 
               style={{ 
                 background: "linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)",
                 borderRadius: "12px"
               }}>
            <div className="card-body p-4">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h2 className="fw-bold mb-1">Welcome back, {user?.firstName || 'Car Owner'}!</h2>
                  <p className="mb-0 lead opacity-75">
                    Here's an overview of your car rental business
                  </p>
                  <div className="mt-3">
                    <Link to="/CarOwner/ManageCarPosts" className="btn btn-light me-2">
                      <FontAwesomeIcon icon={faCar} className="me-2" />
                      Manage Cars
                    </Link>
                    <Link to="/CarOwner/Proposals" className="btn btn-outline-light">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                      View Bookings
                    </Link>
                  </div>
                </div>
                <div className="col-md-4 d-none d-md-block text-end">
                  <img src="https://img.icons8.com/carbon-copy/100/FFFFFF/car.png" alt="Car Icon" style={{ height: "120px" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Key Performance Indicators */}
      <div className="row mb-4">
        <div className="col-12">
          <h5 className="text-muted mb-3">
            <FontAwesomeIcon icon={faChartLine} className="me-2" />
            Key Metrics
          </h5>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="rounded-circle bg-primary bg-opacity-10 p-3">
                  <FontAwesomeIcon icon={faCar} className="fa-2x text-primary" />
                </div>
                <span className="badge bg-primary">{stats.approvedCars}/{stats.totalCars} Approved</span>
              </div>
              <h3 className="fw-bold mb-0">{stats.totalCars}</h3>
              <p className="text-muted mb-2">Cars Listed</p>
              <Link to="/CarOwner/ManageCarPosts" className="text-decoration-none text-primary stretched-link d-flex align-items-center">
                Manage Cars <FontAwesomeIcon icon={faArrowRight} className="ms-1 small" />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="rounded-circle bg-success bg-opacity-10 p-3">
                  <FontAwesomeIcon icon={faMoneyBill} className="fa-2x text-success" />
                </div>
                <span className="badge bg-success">From {stats.totalRentals} Rentals</span>
              </div>
              <h3 className="fw-bold mb-0">{formatCurrency(stats.totalEarnings)}</h3>
              <p className="text-muted mb-2">Total Earnings</p>
              <Link to="/CarOwner/Proposals" className="text-decoration-none text-success stretched-link d-flex align-items-center">
                View All Earnings <FontAwesomeIcon icon={faArrowRight} className="ms-1 small" />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="rounded-circle bg-info bg-opacity-10 p-3">
                  <FontAwesomeIcon icon={faCalendarAlt} className="fa-2x text-info" />
                </div>
                {stats.activeRentals > 0 && 
                  <span className="badge bg-info">Active</span>
                }
              </div>
              <h3 className="fw-bold mb-0">{stats.activeRentals}</h3>
              <p className="text-muted mb-2">Current Bookings</p>
              <Link to="/CarOwner/Proposals" className="text-decoration-none text-info stretched-link d-flex align-items-center">
                Manage Bookings <FontAwesomeIcon icon={faArrowRight} className="ms-1 small" />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="rounded-circle bg-warning bg-opacity-10 p-3">
                  <FontAwesomeIcon icon={faPlus} className="fa-2x text-warning" />
                </div>
              </div>
              <h6 className="fw-bold mb-0">Add a New Car</h6>
              <p className="text-muted mb-2">Expand your fleet</p>
              <Link to="/CarOwner/ManageCarPosts" className="btn btn-warning mt-2 d-flex align-items-center justify-content-center">
                Add Car <FontAwesomeIcon icon={faPlus} className="ms-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Browse Other Cars Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faSearch} className="me-2 text-primary" />
                  Browse Other Cars
                </h5>
                <Link to="/CarsList" className="btn btn-sm btn-outline-primary">
                  View All <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
                </Link>
              </div>
            </div>
            
            {/* Search and Filters */}
            <div className="card-body border-bottom pb-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <FontAwesomeIcon icon={faSearch} className="text-muted" />
                    </span>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Search by make, model, or features..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button 
                        className="btn btn-outline-secondary" 
                        type="button"
                        onClick={() => setSearchTerm('')}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="col-md-2">
                  <select 
                    className="form-select"
                    value={carFilters.make}
                    onChange={(e) => setCarFilters({...carFilters, make: e.target.value})}
                  >
                    <option value="all">All Makes</option>
                    <option value="toyota">Toyota</option>
                    <option value="honda">Honda</option>
                    <option value="ford">Ford</option>
                    <option value="bmw">BMW</option>
                    <option value="mercedes">Mercedes</option>
                    <option value="audi">Audi</option>
                  </select>
                </div>
                
                <div className="col-md-2">
                  <select 
                    className="form-select"
                    value={carFilters.sortBy}
                    onChange={(e) => setCarFilters({...carFilters, sortBy: e.target.value})}
                  >
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>
                
                <div className="col-md-2">
                  <div className="d-flex align-items-center mt-2">
                    <span className="small text-muted me-2">$0</span>
                    <input 
                      type="range" 
                      className="form-range"
                      min="0"
                      max="1000"
                      step="50"
                      value={carFilters.priceRange.max}
                      onChange={(e) => setCarFilters({
                        ...carFilters,
                        priceRange: {
                          ...carFilters.priceRange,
                          max: parseInt(e.target.value)
                        }
                      })}
                    />
                    <span className="small text-muted ms-2">${carFilters.priceRange.max}</span>
                  </div>
                </div>
              </div>
              
              {searchTerm || carFilters.make !== 'all' || carFilters.priceRange.max < 1000 ? (
                <div className="mt-3 d-flex align-items-center">
                  <span className="me-2 text-muted">Filters:</span>
                  {searchTerm && (
                    <span className="badge bg-primary me-2">
                      Search: {searchTerm}
                      <button type="button" className="btn-close btn-close-white ms-2" style={{fontSize: '0.5rem'}} onClick={() => setSearchTerm('')}></button>
                    </span>
                  )}
                  {carFilters.make !== 'all' && (
                    <span className="badge bg-primary me-2">
                      Make: {carFilters.make}
                      <button type="button" className="btn-close btn-close-white ms-2" style={{fontSize: '0.5rem'}} onClick={() => setCarFilters({...carFilters, make: 'all'})}></button>
                    </span>
                  )}
                  {carFilters.priceRange.max < 1000 && (
                    <span className="badge bg-primary me-2">
                      Max Price: ${carFilters.priceRange.max}
                      <button type="button" className="btn-close btn-close-white ms-2" style={{fontSize: '0.5rem'}} onClick={() => setCarFilters({...carFilters, priceRange: {...carFilters.priceRange, max: 1000}})}></button>
                    </span>
                  )}
                  <button 
                    className="btn btn-sm btn-outline-secondary ms-auto"
                    onClick={() => {
                      setSearchTerm('');
                      setCarFilters({
                        priceRange: { min: 0, max: 1000 },
                        make: 'all',
                        sortBy: 'price-asc'
                      });
                    }}
                  >
                    Clear All
                  </button>
                </div>
              ) : null}
            </div>
            
            <div className="card-body">
              {loadingOtherCars ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading available cars...</p>
                </div>
              ) : filteredCars.length > 0 ? (
                <div className="row g-3">
                  {filteredCars.slice(0, 4).map((car, index) => (
                    <div key={car.id} className="col-md-6 col-lg-3">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="position-relative">
                          <img 
                            src={car.imageUrl || 'https://via.placeholder.com/300x200?text=Car+Image'} 
                            className="card-img-top" 
                            alt={car.title}
                            style={{ height: '160px', objectFit: 'cover' }}
                          />
                          <div className="position-absolute bottom-0 end-0 p-2">
                            <span className="badge bg-danger">${car.price}/day</span>
                          </div>
                        </div>
                        <div className="card-body">
                          <h6 className="card-title text-truncate fw-bold mb-1">{car.title}</h6>
                          <p className="card-text text-muted small mb-2">
                            {car.make} {car.model}, {car.year}
                          </p>
                          <div className="d-flex justify-content-between align-items-center mt-3">
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleViewCarDetails(car)}
                            >
                              <FontAwesomeIcon icon={faEye} className="me-1" /> View Details
                            </button>
                            <Link to={`/cars/${car.id}`} className="text-success">
                              <FontAwesomeIcon icon={faEnvelope} className="me-1" /> Contact
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FontAwesomeIcon icon={faCar} className="fa-3x text-muted mb-3" />
                  <p className="text-muted">No cars found matching your filters.</p>
                  <button 
                    className="btn btn-outline-primary mt-2"
                    onClick={() => {
                      setSearchTerm('');
                      setCarFilters({
                        priceRange: { min: 0, max: 1000 },
                        make: 'all',
                        sortBy: 'price-asc'
                      });
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              )}
              
              {filteredCars.length > 4 && (
                <div className="text-center mt-3">
                  <Link to="/CarsList" className="btn btn-primary">
                    View All {filteredCars.length} Cars
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Activity & Quick Links */}
      <div className="row">
        {/* Recent Activity */}
        <div className="col-lg-8 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faClock} className="me-2 text-muted" />
                  Recent Activity
                </h5>
                {stats.recentActivity.length > 0 && (
                  <span className="badge bg-primary rounded-pill">{stats.recentActivity.length}</span>
                )}
              </div>
            </div>
            <div className="card-body p-0">
              {stats.recentActivity.length > 0 ? (
                <div className="list-group list-group-flush">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="list-group-item border-0 border-bottom">
                      <div className="d-flex">
                        <div className="me-3">
                          <div className={`rounded-circle d-flex align-items-center justify-content-center p-2 ${
                            activity.type === 'rental' ? 'bg-info' : 'bg-success'
                          } bg-opacity-10`} style={{ width: "48px", height: "48px" }}>
                            <FontAwesomeIcon 
                              icon={activity.type === 'rental' ? faCalendarAlt : faCheck} 
                              className={`${activity.type === 'rental' ? 'text-info' : 'text-success'}`}
                            />
                          </div>
                        </div>
                        <div>
                          <h6 className="mb-1 fw-bold">{activity.title}</h6>
                          <p className="mb-1 small text-muted">
                            {activity.date.toLocaleDateString(undefined, { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="mb-0 text-dark">{activity.details}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <FontAwesomeIcon icon={faInfoCircle} className="fa-3x text-muted mb-3" />
                  <p className="text-muted mb-0">No recent activity to display</p>
                </div>
              )}
            </div>
            {stats.recentActivity.length > 0 && (
              <div className="card-footer bg-white border-0 text-center">
                <Link to="/CarOwner/Proposals" className="btn btn-outline-primary btn-sm">
                  View All Activity
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Quick Links & Tips */}
        <div className="col-lg-4">
          {/* Quick Actions Card */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faBolt} className="me-2 text-muted" />
                Quick Actions
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                <Link to="/CarOwner/ManageCarPosts" className="list-group-item list-group-item-action border-0 border-bottom d-flex align-items-center py-3">
                  <div className="me-3 rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                    <FontAwesomeIcon icon={faCar} className="text-primary" />
                  </div>
                  <span>Manage My Cars</span>
                  <FontAwesomeIcon icon={faArrowRight} className="ms-auto text-muted" />
                </Link>
                <Link to="/CarOwner/Proposals" className="list-group-item list-group-item-action border-0 border-bottom d-flex align-items-center py-3">
                  <div className="me-3 rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                    <FontAwesomeIcon icon={faList} className="text-danger" />
                  </div>
                  <span>Rental Requests</span>
                  <FontAwesomeIcon icon={faArrowRight} className="ms-auto text-muted" />
                </Link>
                <Link to="/inbox" className="list-group-item list-group-item-action border-0 border-bottom d-flex align-items-center py-3">
                  <div className="me-3 rounded-circle bg-info bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                    <FontAwesomeIcon icon={faEnvelope} className="text-info" />
                  </div>
                  <span>Messages</span>
                  <FontAwesomeIcon icon={faArrowRight} className="ms-auto text-muted" />
                </Link>
                <Link to="#notifications" className="list-group-item list-group-item-action border-0 d-flex align-items-center py-3">
                  <div className="me-3 rounded-circle bg-warning bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                    <FontAwesomeIcon icon={faBell} className="text-warning" />
                  </div>
                  <span>Notifications</span>
                  <span className="ms-auto badge bg-danger">3</span>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Car Owner Tips Card */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faStar} className="me-2 text-muted" />
                Tips for Success
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-start mb-3">
                <div className="me-3 rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px", flexShrink: 0 }}>
                  <FontAwesomeIcon icon={faCamera} className="text-success" />
                </div>
                <div>
                  <h6 className="mb-1 fw-bold">Quality Photos</h6>
                  <p className="mb-0 small">Add clear, high-quality photos of your cars to attract more bookings.</p>
                </div>
              </div>
              
              <div className="d-flex align-items-start mb-3">
                <div className="me-3 rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px", flexShrink: 0 }}>
                  <FontAwesomeIcon icon={faClock} className="text-primary" />
                </div>
                <div>
                  <h6 className="mb-1 fw-bold">Quick Responses</h6>
                  <p className="mb-0 small">Respond promptly to rental requests to increase your conversion rate.</p>
                </div>
              </div>
              
              <div className="d-flex align-items-start mb-3">
                <div className="me-3 rounded-circle bg-info bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px", flexShrink: 0 }}>
                  <FontAwesomeIcon icon={faShieldAlt} className="text-info" />
                </div>
                <div>
                  <h6 className="mb-1 fw-bold">Regular Maintenance</h6>
                  <p className="mb-0 small">Keep your cars well-maintained and check them before and after each rental.</p>
                </div>
              </div>
              
              <div className="d-flex align-items-start">
                <div className="me-3 rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px", flexShrink: 0 }}>
                  <FontAwesomeIcon icon={faStar} className="text-danger" />
                </div>
                <div>
                  <h6 className="mb-1 fw-bold">Accurate Information</h6>
                  <p className="mb-0 small">Keep your car details up to date with accurate information about features and availability.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Car Details Modal */}
      {showCarModal && selectedCar && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">{selectedCar.title}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={handleCloseCarModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <img 
                      src={selectedCar.imageUrl || 'https://via.placeholder.com/600x400?text=Car+Image'} 
                      className="img-fluid rounded mb-3" 
                      alt={selectedCar.title}
                    />
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="badge bg-danger p-2 fs-6">
                        {formatCurrency(selectedCar.price)}/day
                      </span>
                      <span className="badge bg-success p-2">
                        Available Now
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h5 className="mb-3">Car Details</h5>
                    <ul className="list-group mb-3">
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Make:</span>
                        <span className="fw-bold">{selectedCar.make}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Model:</span>
                        <span className="fw-bold">{selectedCar.model}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Year:</span>
                        <span className="fw-bold">{selectedCar.year}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Seats:</span>
                        <span className="fw-bold">{selectedCar.seats || '5'}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Transmission:</span>
                        <span className="fw-bold">{selectedCar.transmission || 'Automatic'}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Fuel Type:</span>
                        <span className="fw-bold">{selectedCar.fuelType || 'Gasoline'}</span>
                      </li>
                    </ul>
                    
                    <h5 className="mb-2">Features</h5>
                    <div className="mb-3">
                      {selectedCar.features ? (
                        <div className="d-flex flex-wrap gap-2">
                          {selectedCar.features.split(',').map((feature, index) => (
                            <span key={index} className="badge bg-secondary py-2 px-3">{feature.trim()}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="d-flex flex-wrap gap-2">
                          <span className="badge bg-secondary py-2 px-3">Air Conditioning</span>
                          <span className="badge bg-secondary py-2 px-3">Bluetooth</span>
                          <span className="badge bg-secondary py-2 px-3">Navigation</span>
                          <span className="badge bg-secondary py-2 px-3">Backup Camera</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedCar.description && (
                  <div className="mt-3">
                    <h5>Description</h5>
                    <p>{selectedCar.description}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseCarModal}>
                  Close
                </button>
                <Link to={`/cars/${selectedCar.id}`} className="btn btn-primary">
                  See Full Details
                </Link>
                <button type="button" className="btn btn-success">
                  <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                  Contact Owner
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </div>
      )}
    </div>
  );
}

