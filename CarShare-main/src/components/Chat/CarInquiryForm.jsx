import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faComments, faSync, faExclamationTriangle, faInfoCircle, faSignInAlt, faBug } from '@fortawesome/free-solid-svg-icons';
import { useChat } from '../../context/ChatContext';
import { useUser } from '../../context/UserContext';
import { Link } from 'react-router-dom';

const CarInquiryForm = ({ carId, ownerId, carTitle }) => {
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const { sendMessage, connection, connectionState, reconnect } = useChat();
  const { user } = useUser();
  const [reconnecting, setReconnecting] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  const handleToggleForm = () => {
    if (!user) {
      setError('Please log in to contact the owner');
      return;
    }
    
    // Don't allow owners to message themselves
    if (user.id === ownerId) {
      setError('You cannot send messages to yourself');
      return;
    }
    
    setShowForm(!showForm);
    setSuccess(false);
    setError(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    if (!user) {
      setError('Please log in to contact the owner');
      return;
    }
    
    setSending(true);
    setError(null);
    
    try {
      console.log('Attempting to send message to owner', ownerId, 'about car', carId);
      
      // Check connection state first
      if (!connection || connection.state !== 'Connected') {
        console.log('Connection not ready, attempting to reconnect...');
        const reconnected = await reconnect();
        if (!reconnected) {
          setError('Chat connection not established. Please try again later.');
          setSending(false);
          return;
        }
      }
      
      const success = await sendMessage(ownerId, carId, message);
      
      if (success) {
        console.log('Message sent successfully');
        setMessage('');
        setSuccess(true);
        setTimeout(() => {
          setShowForm(false);
          setSuccess(false);
        }, 3000);
      } else {
        console.log('Failed to send message');
        setError('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  const handleReconnect = async () => {
    // Only try to reconnect if we have a user and connection
    if (!user) {
      setError('You must be logged in to use the chat features');
      return;
    }
    
    setReconnecting(true);
    setError(null);
    
    try {
      const success = await reconnect();
      if (success) {
        setError('Chat connection established successfully!');
        setTimeout(() => setError(null), 3000);
      } else {
        setError('Failed to establish chat connection. Please try again.');
      }
    } catch (err) {
      setError(`Error connecting: ${err.message}`);
    } finally {
      setReconnecting(false);
    }
  };

  // Get connection status in a user-friendly format
  const getConnectionStatusText = () => {
    // Check if user is logged in
    if (!user) return 'Not logged in';
    
    // Check if connection object exists
    if (!connection) return 'No connection';
    
    // Check connection state
    return connection.state || connectionState || 'Unknown';
  };

  // Get token info for debugging
  const getTokenInfo = () => {
    // Check from user object
    const hasUserToken = user && user.token ? 'Yes' : 'No';
    
    // Check from localStorage
    const localToken = localStorage.getItem('token');
    const hasLocalToken = localToken ? 'Yes' : 'No';
    
    // If we have a local token, get its first few characters
    const tokenPreview = localToken 
      ? `${localToken.substring(0, 10)}...` 
      : 'None';
    
    return {
      hasUserToken,
      hasLocalToken,
      tokenPreview
    };
  };

  // Toggle debug info
  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };
  
  // Get token info for debug display
  const tokenInfo = getTokenInfo();
  
  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <h5 className="card-title">
          <FontAwesomeIcon icon={faComments} className="text-danger me-2" />
          Contact the Owner
        </h5>
        
        {error && (
          <div className="alert alert-danger mt-3">
            {error}
            <button 
              type="button" 
              className="btn-close float-end" 
              onClick={() => setError(null)}
              aria-label="Close"
            ></button>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success mt-3">
            Message sent successfully! The owner will reply soon.
          </div>
        )}
        
        {/* If not logged in, show login prompt */}
        {!user ? (
          <div className="alert alert-info mt-3">
            <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
            Please <Link to="/Login" className="alert-link">log in</Link> or <Link to="/Register" className="alert-link">register</Link> to contact the owner.
          </div>
        ) : (
          <>
            {showForm && (
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                  Connection status: 
                  <span className={connection?.state === 'Connected' ? 'text-success fw-bold ms-1' : 'text-warning fw-bold ms-1'}>
                    {getConnectionStatusText()}
                  </span>
                  <button 
                    className="btn btn-sm btn-link text-muted ms-2 p-0" 
                    onClick={toggleDebug}
                    title="Show debug info"
                  >
                    <FontAwesomeIcon icon={faBug} size="xs" />
                  </button>
                </small>
                
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  onClick={handleReconnect}
                  disabled={reconnecting || !user || (connection && connection?.state === 'Connected')}
                >
                  {reconnecting ? (
                    <>
                      <FontAwesomeIcon icon={faSync} spin className="me-1" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSync} className="me-1" />
                      Reconnect
                    </>
                  )}
                </button>
              </div>
            )}
            
            {/* Debug information */}
            {showForm && showDebug && (
              <div className="alert alert-secondary my-2 p-2">
                <small>
                  <strong>Debug Info:</strong><br />
                  User ID: {user?.userId || 'Unknown'}<br />
                  Connection ID: {connection?.connectionId || 'None'}<br />
                  Connection State: {connection?.state || connectionState || 'Unknown'}<br />
                  Base URL: {window.location.origin}<br />
                  Has Token in User: {tokenInfo.hasUserToken}<br />
                  Has Token in Storage: {tokenInfo.hasLocalToken}<br />
                  Token Preview: {tokenInfo.tokenPreview}<br />
                </small>
              </div>
            )}
            
            {showForm ? (
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <label htmlFor="ownerMessage" className="form-label">Your message about {carTitle}</label>
                  <textarea
                    id="ownerMessage"
                    className="form-control"
                    rows="3"
                    placeholder="Ask questions about the car, scheduling, or special requests..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                
                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleToggleForm}
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={sending || !message.trim() || !user}
                  >
                    {sending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : !connection || connection?.state !== 'Connected' ? (
                      <>
                        <FontAwesomeIcon icon={faSync} className="me-2" />
                        Connect & Send
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="d-grid">
                <button 
                  className="btn btn-outline-danger" 
                  onClick={handleToggleForm}
                >
                  <FontAwesomeIcon icon={faComments} className="me-2" />
                  Send Message to Owner
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CarInquiryForm; 