import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSync, faComments, faInbox, faCircle, faUser, faInfoCircle, faCarSide, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useChat } from '../../context/ChatContext';
import { useUser } from '../../context/UserContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from '../../config/api';

const InboxPage = () => {
  const { 
    conversations, 
    messages, 
    activeConversation, 
    loading, 
    error, 
    sendMessage,
    loadUserConversations,
    loadConversationMessages,
    setActiveConversation,
    clearError,
    connection,
    reconnect
  } = useChat();
  const { user } = useUser();
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');
  const [reconnecting, setReconnecting] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});
  const [carDetails, setCarDetails] = useState({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingCarDetails, setLoadingCarDetails] = useState(false);

  // Load conversations when component mounts
  useEffect(() => {
    if (user && connection) {
      if (connection.state === 'Connected') {
        loadUserConversations();
      } else {
        // Try reconnecting if not connected
        handleReconnect();
      }
    }
  }, [user, connection, loadUserConversations]);

  // Set up connection state change listener
  useEffect(() => {
    if (connection) {
      // Clean up any existing listeners
      const onClose = () => {
        console.log('Connection closed event detected');
        setReconnecting(false);
        // Instead of showing an error, we'll log it but not display it to the user
        // if the connection appears to be working despite the event
        console.warn('Connection close event received but will attempt automatic reconnection');
      };

      const onReconnecting = () => {
        console.log('Connection reconnecting event detected');
        setReconnecting(true);
      };

      const onReconnected = () => {
        console.log('Connection reconnected event detected');
        setReconnecting(false);
        // Clear any error messages since we're reconnected
        clearError();
        // Reload conversations after reconnection
        loadUserConversations();
      };

      // Add listeners
      connection.onclose(onClose);
      connection.onreconnecting(onReconnecting);
      connection.onreconnected(onReconnected);

      return () => {
        // Remove listeners on cleanup
        connection.off('onclose', onClose);
        connection.off('onreconnecting', onReconnecting);
        connection.off('onreconnected', onReconnected);
      };
    }
  }, [connection, loadUserConversations, clearError]);

  // Automatically clear connection-related errors if conversations are loading successfully
  useEffect(() => {
    if (conversations && conversations.length > 0 && error) {
      // If we have conversations loading but still show a connection error,
      // it's likely a false error, so clear it
      if (error.includes('connect') || error.includes('Connection')) {
        clearError();
      }
    }
  }, [conversations, error, clearError]);

  // Fetch user profiles when conversations change
  useEffect(() => {
    if (conversations && conversations.length > 0) {
      fetchUserProfiles();
      fetchCarDetails();
    }
  }, [conversations]);

  // Fetch user profiles for all users in conversations
  const fetchUserProfiles = async () => {
    try {
      setLoadingProfiles(true);
      
      // Create a list of unique user IDs from conversations
      const userIds = [...new Set(
        conversations
          .map(conv => conv.userId || conv.otherUserId)
          .filter(id => id && !userProfiles[id])
      )];
      
      if (userIds.length === 0) {
        setLoadingProfiles(false);
        return;
      }
      
      console.log('Fetching profiles for users:', userIds);
      
      // Fetch each user profile
      const profiles = { ...userProfiles };
      
      await Promise.all(userIds.map(async (userId) => {
        try {
          const response = await axios.get(API.url(API.ENDPOINTS.USER_BY_ID(userId)));
          if (response.data) {
            profiles[userId] = response.data;
            console.log(`Loaded profile for ${userId}:`, response.data);
          }
        } catch (err) {
          console.error(`Failed to load profile for user ${userId}:`, err);
        }
      }));
      
      setUserProfiles(profiles);
    } catch (err) {
      console.error('Error fetching user profiles:', err);
    } finally {
      setLoadingProfiles(false);
    }
  };

  // Fetch car details for all cars in conversations
  const fetchCarDetails = async () => {
    try {
      setLoadingCarDetails(true);
      
      // Create a list of unique car IDs from conversations
      const carIds = [...new Set(
        conversations
          .map(conv => conv.carId)
          .filter(id => id && !carDetails[id])
      )];
      
      if (carIds.length === 0) {
        setLoadingCarDetails(false);
        return;
      }
      
      console.log('Fetching details for cars:', carIds);
      
      // Fetch each car's details
      const cars = { ...carDetails };
      
      await Promise.all(carIds.map(async (carId) => {
        try {
          const response = await axios.get(API.url(API.ENDPOINTS.CAR_DETAILS(carId)));
          if (response.data) {
            cars[carId] = response.data;
            console.log(`Loaded details for car ${carId}:`, response.data);
          }
        } catch (err) {
          console.error(`Failed to load details for car ${carId}:`, err);
        }
      }));
      
      setCarDetails(cars);
    } catch (err) {
      console.error('Error fetching car details:', err);
    } finally {
      setLoadingCarDetails(false);
    }
  };

  // Get user display name from profiles or fallback to ID
  const getUserDisplayName = (userId) => {
    if (!userId) return "Unknown User";
    
    const profile = userProfiles[userId];
    if (profile) {
      // Use the best available name from the profile
      return profile.firstName && profile.lastName 
        ? `${profile.firstName} ${profile.lastName}`
        : profile.username || profile.email || `User ${userId.slice(0, 8)}`;
    }
    
    // Fallback if profile not loaded yet
    return `User ${userId.slice(0, 8)}`;
  };

  // Get car details or fallback to ID
  const getCarDetails = (carId) => {
    if (!carId) return { title: "Unknown Car", id: null };
    
    const car = carDetails[carId];
    if (car) {
      return {
        title: car.title || car.make + ' ' + car.model || `Car ${carId.slice(0, 8)}`,
        id: carId,
        make: car.make,
        model: car.model,
        year: car.year,
        imageUrl: car.imageUrl,
        price: car.price
      };
    }
    
    // Fallback if car details not loaded yet
    return { title: `Car ${carId.slice(0, 8)}`, id: carId };
  };

  // Navigate to car details page
  const navigateToCarDetails = (carId, e) => {
    e.stopPropagation(); // Prevent opening the conversation
    navigate(`/cars/${carId}`);
  };

  // Scroll to bottom of messages when they change
  useEffect(() => {
    const messagesContainer = document.getElementById('inbox-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  // Check if user is logged in, if not redirect to login
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/inbox', message: 'Please log in to view your messages' } });
    }
  }, [user, navigate]);

  // Handle manual reconnect to chat service
  const handleReconnect = async () => {
    if (!user) {
      return;
    }
    
    setReconnecting(true);
    clearError(); // Clear errors before attempting reconnect
    
    try {
      console.log('Attempting to reconnect to chat service...');
      const success = await reconnect();
      
      // Check if we have conversations even if reconnect reports failure
      // This handles the case where connection works despite error messages
      if (success || (conversations && conversations.length > 0)) {
        console.log('Reconnection successful or conversations already available');
        clearError(); // Clear any existing error messages
        await loadUserConversations();
        return;
      } else {
        console.error('Failed to reconnect to chat service');
      }
    } catch (err) {
      console.error('Error during reconnection:', err);
      
      // Even if there was an error, if we have conversations, consider the connection working
      if (conversations && conversations.length > 0) {
        clearError();
      }
    } finally {
      setReconnecting(false);
    }
  };

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeConversation) return;
    
    try {
      const success = await sendMessage(
        activeConversation.otherUserId, 
        activeConversation.carId, 
        newMessage
      );
      
      if (success) {
        setNewMessage('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Handle opening a conversation
  const handleOpenConversation = async (conversation) => {
    // Check if the conversation has user information
    console.log('Opening conversation:', conversation);
    
    // Determine the correct userId to use - check conversation.userId or otherUserId
    const userId = conversation.userId || conversation.otherUserId;
    console.log('Using userId for conversation:', userId);
    
    if (!userId) {
      console.error('No user ID found in conversation:', conversation);
      setError('Error: Could not determine user ID for this conversation');
      return;
    }
    
    await loadConversationMessages(userId, conversation.carId);
  };

  // Handle closing the active conversation
  const handleCloseConversation = () => {
    setActiveConversation(null);
  };

  // Format the timestamp for display
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
             ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // Check connection status more comprehensively
  const connectionState = connection ? connection.state : 'Disconnected';
  const isConnected = connection && connection.state === 'Connected';
  const isConnecting = reconnecting || connection && (connection.state === 'Connecting' || connection.state === 'Reconnecting');
  const isDisconnected = !connection || connection.state === 'Disconnected';

  if (!user) {
    return (
      <div className="container py-5">
        <div className="alert alert-info">
          <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
          Please <Link to="/login">log in</Link> to view your inbox.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <h2 className="mb-0">
                  <FontAwesomeIcon icon={faInbox} className="me-2 text-primary" />
                  Message Inbox
                  {isConnected && (
                    <span className="ms-2 badge bg-success">Connected</span>
                  )}
                  {isConnecting && (
                    <span className="ms-2 badge bg-warning">Connecting...</span>
                  )}
                  {isDisconnected && !isConnecting && conversations && conversations.length > 0 ? (
                    <span className="ms-2 badge bg-warning">Working</span>
                  ) : isDisconnected && !isConnecting && (
                    <span className="ms-2 badge bg-danger">Disconnected</span>
                  )}
                </h2>
                
                {!isConnected && !(conversations && conversations.length > 0) && (
                  <button 
                    className="btn btn-outline-primary" 
                    onClick={handleReconnect}
                    disabled={reconnecting || isConnecting}
                  >
                    {reconnecting || isConnecting ? (
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
                )}
              </div>
              
              {error && !(conversations && conversations.length > 0 && (error.includes('connect') || error.includes('Connection'))) && (
                <div className="alert alert-danger mt-3 mb-0">
                  {error}
                  <button 
                    type="button" 
                    className="btn-close float-end" 
                    onClick={clearError}
                    aria-label="Close"
                  ></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-3">
        {/* Conversations List */}
        <div className="col-md-4 col-lg-3 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-primary text-white">
              <FontAwesomeIcon icon={faComments} className="me-2" />
              Conversations
            </div>
            <ul className="list-group list-group-flush">
              {loading ? (
                <li className="list-group-item text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </li>
              ) : conversations && conversations.length > 0 ? (
                conversations.map((conversation, index) => {
                  const carInfo = getCarDetails(conversation.carId);
                  return (
                    <li 
                      key={`${conversation.userId}-${conversation.carId}`}
                      className={`list-group-item list-group-item-action d-flex align-items-center py-3 ${activeConversation && 
                        activeConversation.otherUserId === conversation.userId &&
                        activeConversation.carId === conversation.carId ? 'active' : ''}`}
                      onClick={() => handleOpenConversation(conversation)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="me-2 position-relative">
                        <div className="position-relative">
                          <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" 
                               style={{ width: '40px', height: '40px', fontSize: '18px' }}>
                            {getUserDisplayName(conversation.userId || conversation.otherUserId).charAt(0).toUpperCase()}
                          </div>
                          {conversation.unreadCount > 0 && (
                            <span 
                              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger text-white" 
                            >
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="d-flex justify-content-between">
                          <span className="fw-bold text-truncate">
                            {getUserDisplayName(conversation.userId || conversation.otherUserId)}
                          </span>
                          <small className="text-muted ms-2">
                            {formatMessageTime(conversation.lastMessageTime)}
                          </small>
                        </div>
                        {carInfo && (
                          <div className="small text-muted">
                            <FontAwesomeIcon icon={faCarSide} className="me-1" />
                            <span 
                              className="text-primary cursor-pointer"
                              onClick={(e) => navigateToCarDetails(carInfo.id, e)}
                              style={{ textDecoration: 'underline', cursor: 'pointer' }}
                            >
                              {carInfo.title}
                            </span>
                          </div>
                        )}
                        <div className="small text-truncate">
                          {activeConversation && 
                           activeConversation.otherUserId === (conversation.userId || conversation.otherUserId) && 
                           activeConversation.carId === conversation.carId && 
                           messages && messages.length > 0 ? 
                            messages[messages.length - 1].message || messages[messages.length - 1].text || messages[messages.length - 1].content || "No messages yet" : 
                            "Click to view messages"
                          }
                        </div>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="list-group-item text-center py-4 text-muted">
                  No conversations yet
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Message Area */}
        <div className="col-md-8 col-lg-9">
          <div className="card shadow-sm h-100">
            {activeConversation ? (
              <>
                <div className="card-header bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                             style={{ width: '48px', height: '48px', fontSize: '20px' }}>
                          {getUserDisplayName(activeConversation.otherUserId).charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="fw-bold fs-5">
                          {getUserDisplayName(activeConversation.otherUserId)}
                        </div>
                        {activeConversation.isOnline && (
                          <div className="text-success small">
                            <FontAwesomeIcon icon={faCircle} size="xs" className="me-1" />
                            Online
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      {activeConversation.carId && (
                        <div className="d-flex align-items-center bg-light rounded p-2 me-3">
                          <FontAwesomeIcon icon={faCarSide} className="me-2 text-primary" />
                          <span 
                            className="text-primary cursor-pointer fw-bold"
                            onClick={(e) => navigateToCarDetails(activeConversation.carId, e)}
                            style={{ textDecoration: 'underline', cursor: 'pointer' }}
                          >
                            {getCarDetails(activeConversation.carId).title}
                          </span>
                        </div>
                      )}
                      <button 
                        className="btn btn-outline-danger"
                        onClick={handleCloseConversation}
                        title="Exit conversation"
                      >
                        <FontAwesomeIcon icon={faTimes} className="me-1" /> Exit
                      </button>
                    </div>
                  </div>
                </div>

                <div 
                  id="inbox-messages" 
                  className="p-3 overflow-auto" 
                  style={{ height: "400px", backgroundColor: "#f8f9fa" }}
                >
                  {messages.length === 0 ? (
                    <div className="text-center text-muted p-5">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      // Check who sent the message
                      const isFromMe = 
                        (msg.senderId === user.userId) || 
                        (msg.isOwnMessage === true) || 
                        (msg.isFromCurrentUser === true);
                      
                      // Get message content from any property name
                      const messageText = msg.message || msg.text || msg.content || "";
                      const messageTime = msg.timestamp ? new Date(msg.timestamp) : new Date();
                      
                      return (
                        <div 
                          key={index}
                          className={`d-flex mb-3 ${isFromMe ? 'justify-content-end' : 'justify-content-start'}`}
                        >
                          {!isFromMe && (
                            <div className="me-2">
                              <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" 
                                  style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                                {getUserDisplayName(msg.senderId).charAt(0).toUpperCase()}
                              </div>
                            </div>
                          )}
                          
                          <div 
                            className={`p-3 rounded-3 ${isFromMe 
                              ? 'bg-primary text-white' 
                              : 'bg-white border'}`}
                            style={{ maxWidth: '75%' }}
                          >
                            {!isFromMe && (
                              <div className="small fw-bold mb-1">
                                {getUserDisplayName(msg.senderId)}
                              </div>
                            )}
                            <div>{messageText}</div>
                            <small 
                              className={`d-block text-end mt-1 ${isFromMe ? 'text-white-50' : 'text-muted'}`}
                            >
                              {formatMessageTime(messageTime)}
                            </small>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="card-footer bg-light">
                  <form onSubmit={handleSendMessage}>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={isConnected ? "Type your message..." : "Waiting for connection..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={!isConnected}
                      />
                      <button 
                        className="btn btn-primary" 
                        type="submit"
                        disabled={!newMessage.trim() || !isConnected}
                      >
                        <FontAwesomeIcon icon={faPaperPlane} />
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="card-body d-flex flex-column justify-content-center align-items-center text-center p-5">
                <FontAwesomeIcon icon={faComments} className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                <h5>Select a conversation</h5>
                <p className="text-muted">Choose a conversation from the list to view messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboxPage; 