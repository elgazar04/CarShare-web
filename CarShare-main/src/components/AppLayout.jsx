import React from 'react';
import { Outlet } from 'react-router-dom';
import GuestNavbar from './GuestNavbar';
import Footer from './Footer';
import { useUser } from '../context/UserContext';

const AppLayout = () => {
  const { user } = useUser();
  
  return (
    <div className="d-flex flex-column min-vh-100">
      <GuestNavbar />
      
      <main className="flex-grow-1">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
};

export default AppLayout; 