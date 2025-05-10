import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import API from '../config/api';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // Set up axios defaults when user is authenticated
  useEffect(() => {
    if (user && user.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [user]);

  // Load user from localStorage on first page load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          userId: decoded.sub || decoded.nameidentifier,
          email: decoded.email,
          role: decoded.role,
          token,
        });
        
        // Set default Authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("token");
      }
    }
  }, []);

  const login = (data) => {
    if (!data.token) {
      console.error("No token provided in login data", data);
      return;
    }
    
    try {
      const decoded = jwtDecode(data.token);
      const userData = {
        userId: decoded.sub || decoded.nameidentifier, 
        email: decoded.email,
        role: decoded.role,
        token: data.token,
      };
      
      setUser(userData);
      localStorage.setItem("token", data.token);
      
      // Set default Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    } catch (error) {
      console.error("Failed to decode token", error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
