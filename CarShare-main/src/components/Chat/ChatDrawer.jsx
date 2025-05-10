import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faChevronLeft, faPaperPlane, faCommentDots, faUserShield, faExclamationTriangle, faSync, faInfoCircle, faSignInAlt, faBug, faRobot } from '@fortawesome/free-solid-svg-icons';
import { useChat } from '../../context/ChatContext';
import { useUser } from '../../context/UserContext';
import { Link } from 'react-router-dom';

// Helper to safely get token info for debugging
const getTokenInfo = (user) => {
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

const ChatDrawer = ({ isOpen, onClose }) => {
  const { 
    conversations, 
    messages, 
    systemMessages,
    activeConversation, 
    loading, 
    error, 
    sendMessage,
    sendSupportMessage,
    sendAdminReply,
    loadUserConversations,
    loadConversationMessages,
    setActiveConversation,
    clearError,
    connection,
    connectionState,
    reconnect
  } = useChat();
  const { user } = useUser();
  const [newMessage, setNewMessage] = useState('');
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  // Get latest conversations when the drawer opens
  useEffect(() => {
    if (isOpen && user && connection && connection.state === 'Connected') {
      loadUserConversations();
    }
  }, [isOpen, loadUserConversations, connection, user]);
  
  // Scroll to bottom of messages when they change
  useEffect(() => {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages, systemMessages]);

  // Check connection status
  const isConnected = connection && connection.state === 'Connected';
  const isConnecting = connection && (connection.state === 'Connecting' || connectionState === 'connecting' || connectionState === 'reconnecting');
  const isDisconnected = !connection || connection.state === 'Disconnected' || connectionState === 'disconnected';
  
  // Get token info for debug display
  const tokenInfo = getTokenInfo(user);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to send messages');
      return;
    }
    
    if (!newMessage.trim()) return;
    
    // Check connection and try to reconnect if needed
    if (!isConnected) {
      const reconnected = await handleManualReconnect(false); // Don't show errors
      if (!reconnected) {
        setError('Cannot send message: No connection to chat service.');
        return;
      }
    }
    
    let success = false;
    
    if (activeConversation) {
      // Regular message in a conversation
      success = await sendMessage(activeConversation.otherUserId, activeConversation.carId, newMessage);
    } else if (showSupportForm) {
      // Support message
      success = await sendSupportMessage(newMessage);
      if (success) {
        setShowSupportForm(false);
      }
    }
    
    if (success) {
      setNewMessage('');
    }
  };
  
  const handleOpenConversation = async (conversation) => {
    if (!user) {
      setError('You must be logged in to view conversations');
      return;
    }
    
    if (!isConnected) {
      const reconnected = await handleManualReconnect(false); // Don't show errors
      if (!reconnected) {
        setError('Cannot open conversation: No connection to chat service.');
        return;
      }
    }
    await loadConversationMessages(conversation.otherUserId, conversation.carId);
  };
  
  const handleBackToList = () => {
    setActiveConversation(null);
    setShowSupportForm(false);
  };
  
  const handleManualReconnect = async (showErrorMessages = true) => {
    if (!user) {
      if (showErrorMessages) {
        setError('You must be logged in to use chat features');
      }
      return false;
    }
    
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      if (showErrorMessages) {
        setError('No authentication token found. Please log out and log in again.');
      }
      return false;
    }
    
    if (reconnecting) return false;
    
    setReconnecting(true);
    if (showErrorMessages) {
      setError('Attempting to reconnect...');
    }
    
    try {
      const success = await reconnect();
      if (success) {
        clearError();
        if (isOpen) {
          loadUserConversations();
        }
        return true;
      } else {
        if (showErrorMessages) {
          setError('Reconnection failed. Please try again or refresh the page.');
        }
        return false;
      }
    } catch (err) {
      console.error('Manual reconnection failed:', err);
      if (showErrorMessages) {
        setError(`Reconnection error: ${err.message}`);
      }
      return false;
    } finally {
      setReconnecting(false);
    }
  };
  
  // Toggle debug info
  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };
  
  // Render debug info component
  const renderDebugInfo = () => (
    <div className="mt-2 p-2 bg-light rounded">
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
  );
  
  // Connection status display
  const renderConnectionStatus = () => {
    if (!user) {
      return (
        <div className="alert alert-warning m-2">
          <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
          You must be logged in to use chat features.
        </div>
      );
    }
    
    if (isDisconnected) {
      return (
        <div className="alert alert-warning m-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              Not connected to chat service.
            </div>
            <div>
              <button 
                className="btn btn-sm btn-warning me-1" 
                onClick={handleManualReconnect}
                disabled={reconnecting}
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
              <button 
                className="btn btn-sm btn-outline-secondary" 
                onClick={toggleDebug}
                title="Show debug info"
              >
                <FontAwesomeIcon icon={faBug} />
              </button>
            </div>
          </div>
          
          {showDebug && renderDebugInfo()}
        </div>
      );
    }
    
    if (isConnecting) {
      return (
        <div className="alert alert-info m-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              Connecting to chat service...
            </div>
            <button 
              className="btn btn-sm btn-outline-secondary" 
              onClick={toggleDebug}
              title="Show debug info"
            >
              <FontAwesomeIcon icon={faBug} />
            </button>
          </div>
          
          {showDebug && renderDebugInfo()}
        </div>
      );
    }
    
    if (isConnected) {
      return (
        <div className="d-flex justify-content-between align-items-center text-success p-2">
          <small>
            <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
            Connected to chat service
          </small>
          <button 
            className="btn btn-sm btn-link text-muted" 
            onClick={toggleDebug}
            title="Show debug info"
          >
            <FontAwesomeIcon icon={faBug} size="xs" />
          </button>
          
          {showDebug && (
            <div className="mt-2 p-2 bg-light rounded position-absolute top-100 start-0 end-0 z-3">
              {renderDebugInfo()}
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };
  
  // Not logged in content
  const renderNotLoggedInContent = () => (
    <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center p-4">
      <div className="text-center mb-4">
        <FontAwesomeIcon icon={faSignInAlt} className="text-danger mb-3" style={{ fontSize: '3rem' }} />
        <h5>Please log in to use chat</h5>
        <p className="text-muted">You need to be logged in to send and receive messages.</p>
      </div>
      <div className="d-grid gap-2 col-8">
        <Link to="/Login" className="btn btn-danger">
          Log In
        </Link>
        <Link to="/Register" className="btn btn-outline-danger">
          Register
        </Link>
      </div>
    </div>
  );
  
  // The message rendering function in the conversation view should be updated
  // to handle system messages and different message format from server
  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <div className="text-center p-4">
          <p className="text-muted">No messages yet. Start the conversation!</p>
        </div>
      );
    }
    
    // Combine regular messages and any relevant system messages
    const allMessages = [...messages];
    
    // Sort by timestamp
    allMessages.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp) : new Date();
      const timeB = b.timestamp ? new Date(b.timestamp) : new Date();
      return timeA - timeB;
    });
    
    return allMessages.map((msg, index) => {
      // Check all the possible property names the backend might use
      const senderId = msg.senderId || msg.userId;
      
      // Check if the message is from the current user
      // Handle different ways the backend might indicate message ownership
      const isFromMe = 
        (senderId === user?.userId) || 
        (msg.isOwnMessage === true) || 
        (msg.isFromCurrentUser === true);
      
      const isSystem = msg.isSystem;
      const messageText = msg.message || msg.text || msg.content || "";
      const messageTime = msg.timestamp ? new Date(msg.timestamp) : new Date();
      
      if (isSystem) {
        // Render system message
        return (
          <div key={`system-${index}`} className="d-flex justify-content-center mb-3">
            <div className="p-2 bg-light text-muted rounded-3 small">
              <FontAwesomeIcon icon={faRobot} className="me-1" />
              {messageText}
            </div>
          </div>
        );
      } else {
        // Render regular user message
        return (
          <div 
            key={index}
            className={`d-flex mb-3 ${isFromMe ? 'justify-content-end' : 'justify-content-start'}`}
          >
            <div 
              className={`p-3 rounded-3 ${isFromMe 
                ? 'bg-danger text-white' 
                : 'bg-white border'}`}
              style={{ maxWidth: '75%' }}
            >
              <p className="mb-0">{messageText}</p>
              <small 
                className={`d-block text-end mt-1 ${isFromMe ? 'text-white-50' : 'text-muted'}`}
              >
                {messageTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </small>
            </div>
          </div>
        );
      }
    });
  };
  
  return (
    <div className={`chat-drawer position-fixed top-0 end-0 h-100 bg-white shadow-lg ${isOpen ? 'show' : ''}`}
         style={{ 
           width: '350px', 
           transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
           transition: 'transform 0.3s ease-in-out',
           zIndex: 1050,
           display: 'flex',
           flexDirection: 'column'
         }}>
      
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-danger text-white">
        <h5 className="mb-0">
          {activeConversation ? (
            <button className="btn btn-link text-white p-0 me-2" onClick={handleBackToList}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
          ) : null}
          {activeConversation 
            ? `Chat with ${activeConversation.otherUserName}` 
            : (showSupportForm ? 'Contact Support' : 'Messages')}
        </h5>
        <button className="btn btn-link text-white p-0" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      {/* Connection status */}
      {renderConnectionStatus()}
      
      {/* Error message */}
      {error && !error.startsWith('System:') && (
        <div className="alert alert-danger m-2">
          {error}
          <button className="btn-close float-end" onClick={clearError}></button>
        </div>
      )}
      
      {/* Loading state */}
      {loading && user && (
        <div className="d-flex justify-content-center p-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      
      {/* Not logged in state */}
      {!user ? renderNotLoggedInContent() : (
        <>
          {/* Conversations list */}
          {!loading && !activeConversation && !showSupportForm && (
            <div className="flex-grow-1 overflow-auto p-2">
              {!isConnected ? (
                <div className="text-center p-4">
                  <p className="text-muted">Please wait for chat connection to be established or click reconnect above.</p>
                  {user && (
                    <button 
                      className="btn btn-outline-danger mt-2"
                      onClick={() => handleManualReconnect(true)}
                      disabled={reconnecting}
                    >
                      {reconnecting ? (
                        <>
                          <FontAwesomeIcon icon={faSync} spin className="me-1" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faSync} className="me-1" />
                          Connect Now
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-muted">No conversations yet.</p>
                  <button 
                    className="btn btn-outline-danger mt-2"
                    onClick={() => setShowSupportForm(true)}
                  >
                    <FontAwesomeIcon icon={faUserShield} className="me-2" />
                    Contact Support
                  </button>
                </div>
              ) : (
                <>
                  <ul className="list-group">
                    {conversations.map((conversation) => (
                      <li 
                        key={`${conversation.otherUserId}-${conversation.carId}`}
                        className="list-group-item list-group-item-action d-flex align-items-center p-3 border-0 border-bottom"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleOpenConversation(conversation)}
                      >
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">{conversation.otherUserName}</h6>
                            <small className="text-muted">{new Date(conversation.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                          </div>
                          <p className="mb-0 small text-truncate">
                            {conversation.carTitle && (
                              <span className="text-muted me-1">[{conversation.carTitle}]</span>
                            )}
                            {conversation.lastMessage}
                          </p>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <span className="badge bg-danger rounded-pill ms-2">{conversation.unreadCount}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="d-flex justify-content-center mt-3">
                    <button 
                      className="btn btn-outline-danger"
                      onClick={() => setShowSupportForm(true)}
                      disabled={!isConnected}
                    >
                      <FontAwesomeIcon icon={faUserShield} className="me-2" />
                      Contact Support
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Support contact form */}
          {!loading && !activeConversation && showSupportForm && (
            <div className="flex-grow-1 d-flex flex-column">
              <div className="flex-grow-1 p-3">
                <p className="text-muted">
                  Send a message to our support team. We'll get back to you as soon as possible.
                </p>
                
                <form onSubmit={handleSendMessage} className="mt-3">
                  <div className="form-group">
                    <label htmlFor="supportMessage" className="form-label">Your message</label>
                    <textarea
                      id="supportMessage"
                      className="form-control"
                      rows="5"
                      placeholder="How can we help you?"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      required
                      disabled={!isConnected}
                    />
                  </div>
                  
                  <div className="d-flex justify-content-between mt-3">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleBackToList}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-danger"
                      disabled={!newMessage.trim() || !isConnected}
                    >
                      {isConnected ? (
                        <>
                          <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                          Send Message
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faSync} className="me-2 fa-spin" />
                          Connecting...
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* Active conversation */}
          {!loading && activeConversation && (
            <>
              {/* Car info if this is a car inquiry */}
              {activeConversation.carTitle && (
                <div className="p-2 bg-light border-bottom">
                  <small className="text-muted">
                    This conversation is about: <strong>{activeConversation.carTitle}</strong>
                  </small>
                </div>
              )}
              
              {/* Messages */}
              <div id="chat-messages" className="flex-grow-1 overflow-auto p-3" style={{ backgroundColor: '#f8f9fa' }}>
                {renderMessages()}
              </div>
              
              {/* Message input */}
              <form onSubmit={handleSendMessage} className="p-2 border-top">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder={isConnected ? "Type a message..." : "Waiting for connection..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={!isConnected}
                  />
                  <button
                    className="btn btn-danger"
                    type="submit"
                    disabled={!newMessage.trim() || !isConnected}
                  >
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </button>
                </div>
              </form>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ChatDrawer; 