import { Outlet } from 'react-router-dom';
import Navbar from '../components/GuestNavbar';
import Footer from '../components/Footer';
import { useUser } from '../context/UserContext';

const Layout = () => {
  const { user } = useUser();
  
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="container mt-4 flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
