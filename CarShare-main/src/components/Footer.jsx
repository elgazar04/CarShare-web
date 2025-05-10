import { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const button = document.getElementById('backToTop');
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        button?.classList.remove('d-none');
      } else {
        button?.classList.add('d-none');
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <footer className="bg-dark text-white pt-5 pb-3 mt-auto position-relative">
      <div className="container">
        <div className="row justify-content-between align-items-start">
          {/* Logo and Description */}
          <div className="col-md-4 mb-3">
            <h5 className="text-danger font-weight-bold">CarRental</h5>
            <p className="small">Smart way to rent and manage your car with ease and flexibility.</p>
          </div>

          {/* Quick Links */}
          <div className="col-md-4 mb-3">
            <h6 className="text-danger font-weight-bold">Quick Links</h6>
            <ul className="list-unstyled">
              <li><a href="/Home" className="text-white text-decoration-none hover-link">Home</a></li>
              <li><a href="/Login" className="text-white text-decoration-none hover-link">Login</a></li>
              <li><a href="/Register" className="text-white text-decoration-none hover-link">Register</a></li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="col-md-4 mb-3 text-md-end">
            <h6 className="text-danger fw-bold">Follow Us</h6>
            <div className="d-flex justify-content-md-end gap-3">
              <a
                href="#"
                className="social-icon text-white d-flex align-items-center justify-content-center"
                style={{ backgroundColor: '#3b5998', width: '40px', height: '40px', borderRadius: '50%' }}
                title="Facebook"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
              <a
                href="#"
                className="social-icon text-white d-flex align-items-center justify-content-center"
                style={{ backgroundColor: '#1da1f2', width: '40px', height: '40px', borderRadius: '50%' }}
                title="Twitter"
              >
                <i className="fab fa-twitter"></i>
              </a>
              <a
                href="#"
                className="social-icon text-white d-flex align-items-center justify-content-center"
                style={{
                  backgroundImage: 'linear-gradient(45deg, #f58529, #dd2a7b, #8134af)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%'
                }}
                title="Instagram"
              >
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
        </div>

        <hr className="bg-secondary my-4" />
        <div className="text-center small">
          &copy; {new Date().getFullYear()} CarRental. All rights reserved. <br />
          <a href="#" className="text-white text-decoration-none">Terms of Use</a> | 
          <a href="#" className="text-white text-decoration-none"> Privacy Policy</a>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        id="backToTop"
        onClick={scrollToTop}
        className="btn btn-danger rounded-circle position-fixed bottom-0 end-0 m-4 d-none"
        style={{ zIndex: 999 }}
        title="Back to top"
      >
        <i className="fas fa-chevron-up"></i>
      </button>
    </footer>
  );
}

export default Footer;
