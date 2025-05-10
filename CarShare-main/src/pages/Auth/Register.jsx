import 'bootstrap/dist/css/bootstrap.min.css';
import { useFormik } from "formik";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import API from '../../config/api';

export default function Register() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      phoneNumber: "",
      role: "Renter", // Use string role names that match the backend
    },
    onSubmit: handleSubmitForm,
    validate: handleValidationForm,
  });

  async function handleSubmitForm(values) {
    try {
      const response = await axios.post(API.url(API.ENDPOINTS.REGISTER), values);
      formik.resetForm();
      setErrorMessage("");
      setSuccessMessage("Registration successful! Redirecting to Login...");
      setTimeout(() => navigate("../Login"), 2000);
    } catch (error) {
      console.error("Registration error:", error);
      const data = error.response?.data;
      if (data?.field === 'email') formik.setFieldError('email', data.message);
      else if (data?.field === 'role') formik.setFieldError('role', data.message);
      else if (data?.message) setErrorMessage(data.message);
      else setErrorMessage("The email already exists. Please try another email.");
    }
  }

  function handleValidationForm(values) {
    const errors = {};
    const nameRegex = /^[A-Z][a-z]{2,5}$/;
    const phoneRegex = /^\+?[0-9]{2,15}$/;
    const emailRegex = /[A-Za-z0-9\._%+\-]+@[A-Za-z0-9\.\-]+\.[A-Za-z]{2,}/;
    const passwordRegex = /[a-zA-Z0-9-_@#$]{8,}/;

    if (!values.firstName) errors.firstName = "The first name is required";
    else if (!nameRegex.test(values.firstName)) errors.firstName = "Start with a capital letter. 3–10 characters";

    if (!values.lastName) errors.lastName = "The last name is required";
    else if (!nameRegex.test(values.lastName)) errors.lastName = "Start with a capital letter. 3–10 characters";

    if (!values.username) errors.username = "The user name is required";
    else if (!nameRegex.test(values.username)) errors.username = "Start with a capital letter. 3–10 characters";

    if (!values.phoneNumber) errors.phoneNumber = "Phone number is required";
    else if (!phoneRegex.test(values.phoneNumber)) errors.phoneNumber = "Invalid phone number format";

    if (!values.email) errors.email = "The email is required";
    else if (!emailRegex.test(values.email)) errors.email = "Invalid email format";

    if (!values.password) errors.password = "The password is required";
    else if (!passwordRegex.test(values.password)) errors.password = "Minimum 8 characters";

    return errors;
  }

  return (
    <div className="container mt-5" style={{ maxWidth: '550px' }}>
      <div className="card shadow-lg border-0 p-4">
      <h2
    className="text-uppercase fw-bold text-dark text-center"
    style={{
      fontSize: "2.5rem",
      letterSpacing: "1px",
      borderBottom: "3px solid #dc3545",
      paddingBottom: "10px",
    }}
  >
  Register
  </h2>

        {successMessage && <div className="alert alert-success text-center">{successMessage}</div>}
        {errorMessage && <div className="alert alert-danger text-center">{errorMessage}</div>}

        <form onSubmit={formik.handleSubmit}>
          {["firstName", "lastName", "username", "phoneNumber", "email", "password"].map(field => (
            <div className="mb-3" key={field}>
              <label htmlFor={field} className="form-label text-capitalize">
                {field === "phoneNumber" ? "Mobile Number" : field === "username" ? "User Name" : field}
              </label>
              <input
                type={field === "email" ? "email" : field === "password" ? "password" : "text"}
                className="form-control"
                id={field}
                name={field}
                placeholder={`Enter your ${field === "phoneNumber" ? "mobile number" : field}`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched[field] && formik.errors[field] && (
                <small className="text-danger">{formik.errors[field]}</small>
              )}
            </div>
          ))}

          <div className="mb-4">
            <label htmlFor="role" className="form-label">Role</label>
            <select
              className="form-select"
              id="role"
              name="role"
              value={formik.values.role}
              onChange={formik.handleChange}
            >
              <option value="Admin">Admin</option>
              <option value="CarOwner">Car Owner</option>
              <option value="Renter">Renter</option>
            </select>
          </div>

          <button type="submit" className="btn btn-danger w-100 fw-bold py-2">
            Register
          </button>
        </form>
        <div className="text-center mt-3">
            <span>Already have an account? </span>
            <a href="/Login" className="fw-bold text-danger text-decoration-none">
              Login
            </a>
          </div>
      </div>
    </div>
  );
}
