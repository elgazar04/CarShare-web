import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API from '../config/api';

const Home = () => {
  const [cars, setCars] = useState([]);

  useEffect(() => {
    // Fetching cars from the backend API using centralized API config
    axios.get(API.url(API.ENDPOINTS.CARS))
      .then(response => {
        console.log(response.data);
        setCars(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the cars!', error);
      });
  }, []);

  const navigate = useNavigate();

  const handleBookNow = () => {
    navigate("/Login");
  };

  return (
    <div className="container mt-5">
      <h2
        className="text-uppercase fw-bold text-center"
        style={{
          fontSize: "2.5rem",
          letterSpacing: "1px",
          borderBottom: "3px solid #dc3545",
          paddingBottom: "10px",
          color: "#212529"}}>
        Available Cars
      </h2>

      <div className="row mt-4">
        {Array.isArray(cars) && cars.length > 0 ? (
          cars.map(car => (
            <div className="col-md-4 mb-4" key={car.carId}>
                <div
                  className="card bg-dark text-light shadow-lg rounded-4 border-danger border-2"
                    style={{
                      transition: 'transform 0.3s ease',
                      cursor: 'pointer'}}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  > 
                  <div className="card-body">
                    <h5 className="card-title text-danger">{car.title}</h5>
                    <p className="card-text">Brand: {car.brand}</p> 
                    <p className="card-text">Model: {car.model}</p>
                    <p className="card-text">Year: {car.year}</p>
                    <p className="card-text">Price per day: ${car.pricePerDay}</p>
                    <p className="card-text">Location: {car.location}</p>
                    <p className="card-text">Transmission: {car.transmission}</p>
                     <p className="card-text">Rental Status: {car.rentalStatus}</p> 
                    <p className="card-text">Owner:
                    {car.carOwner ? car.carOwner.name : ' Unknown'}</p>
                    
                    <button className="btn btn-danger mt-2 w-100" onClick={handleBookNow}>Book Now</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted">No cars available at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default Home;

