import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';
import { useUser } from './UserContext';
import API from '../config/api';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [connection, setConnection] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemMessages, setSystemMessages] = useState([]);
  const { user } = useUser();

  // Helper to get the auth token from either user object or localStorage
  const getAuthToken = useCallback(() => {
    // First try to get token from user object
    if (user && user.token) {
      console.log('Using token from user object');
      return user.token;
    }
    
    // If not available in user object, try localStorage
    const localToken = localStorage.getItem('token');
    if (localToken) {
      console.log('Using token from localStorage');
      return localToken;
    }
    
    console.log('No token available');
    return null;
  }, [user]);

  // Function to start the SignalR connection
  const startSignalRConnection = useCallback(async (hubConnection) => {
    if (!hubConnection) {
      console.error('No hub connection to start');
      return false;
    }
    
    try {
      console.log('Starting SignalR connection...');
      setConnectionState('connecting');
      await hubConnection.start();
      console.log('SignalR connection started successfully!');
      setConnectionState('connected');
      return true;
    } catch (err) {
      console.error('Error starting SignalR connection:', err);
      setConnectionState('error');
      setError(`Failed to start chat connection: ${err.message}`);
      return false;
    }
  }, []);
  
  // Initialize SignalR connection when user changes
  useEffect(() => {
    let hubConnection = null;
    
    const initializeConnection = async () => {
      // Get token using the helper function
      const token = getAuthToken();
      
      if (!user || !token) {
        console.log('No user or token, skipping connection setup');
        setConnection(null);
        setConnectionState('disconnected');
        setLoading(false);
        return;
      }

      try {
        console.log('Initializing SignalR connection...');
        setLoading(true);
        
        // Extract the base URL correctly by replacing '/api' at the end
        // Use regex to ensure we only replace /api at the end of the string
        const baseUrlRegex = /\/api$/;
        const baseUrl = baseUrlRegex.test(API.BASE_URL) 
          ? API.BASE_URL.replace(baseUrlRegex, '')
          : API.BASE_URL.split('/api')[0];
        
        const connectionUrl = `${baseUrl}/hubs/chat`;
        
        console.log(`Creating connection to: ${connectionUrl} with token`);
        
        // Create new hub connection
        hubConnection = new HubConnectionBuilder()
          .withUrl(connectionUrl, {
            accessTokenFactory: () => token,
            skipNegotiation: false,
            transport: HttpTransportType.WebSockets
          })
          .withAutomaticReconnect([0, 1000, 2000, 5000, 10000])
          .configureLogging(LogLevel.Information)
          .build();
        
        // Set up connection state change handlers
        hubConnection.onreconnecting((error) => {
          console.log('SignalR reconnecting:', error);
          setConnectionState('reconnecting');
          setError('Connection lost. Attempting to reconnect...');
        });
        
        hubConnection.onreconnected((connectionId) => {
          console.log('SignalR reconnected with ID:', connectionId);
          setConnectionState('connected');
          setError(null);
          loadUserConversations(hubConnection);
        });
        
        hubConnection.onclose((error) => {
          console.log('SignalR connection closed:', error);
          setConnectionState('disconnected');
          setError('Connection closed. Please refresh the page to reconnect.');
        });
        
        // Set up message handler
        hubConnection.on('ReceiveMessage', (senderId, message, carId) => {
          console.log('Received message from', senderId, 'about car', carId);
          
          // Add the new message to the messages array
          setMessages(prev => [...prev, { 
            senderId, 
            message, 
            carId, 
            timestamp: new Date() 
          }]);
          
          // If this is not the active conversation, increment unread count
          if (!activeConversation || 
              activeConversation.otherUserId !== senderId || 
              activeConversation.carId !== carId) {
            setUnreadCount(prev => prev + 1);
          }
        });
        
        // Add system message handler
        hubConnection.on('ReceiveSystemMessage', (message) => {
          console.log('Received system message:', message);
          
          // Add to system messages
          setSystemMessages(prev => [...prev, {
            message,
            timestamp: new Date(),
            isSystem: true
          }]);
          
          // Also add a temporary error notification
          setError(`System: ${message}`);
          // Clear after 5 seconds
          setTimeout(() => {
            setError(prev => prev === `System: ${message}` ? null : prev);
          }, 5000);
        });
        
        // Add notification handler
        hubConnection.on('NewMessageNotification', (notification) => {
          console.log('Received notification:', notification);
          // You can handle notifications separately if needed
        });
        
        // Store the connection
        setConnection(hubConnection);
        
        // Start the connection
        const success = await startSignalRConnection(hubConnection);
        if (success) {
          await loadUserConversations(hubConnection);
        }
      } catch (err) {
        console.error('Error setting up SignalR:', err);
        setError(`Error setting up chat: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    initializeConnection();
    
    // Cleanup on unmount
    return () => {
      if (hubConnection) {
        console.log('Stopping SignalR connection on cleanup');
        hubConnection.stop()
          .then(() => console.log('SignalR connection stopped on cleanup'))
          .catch(err => console.error('Error stopping SignalR connection on cleanup:', err));
      }
    };
  }, [user, getAuthToken, startSignalRConnection]);

  // Create function to load conversations using the provided connection or the stored one
  const loadUserConversations = async (hubConnection = null) => {
    const conn = hubConnection || connection;
    
    if (!conn) {
      console.error('Cannot load conversations: No connection object');
      return;
    }

    if (conn.state !== 'Connected') {
      console.log('Cannot load conversations: Connection not in Connected state. Current state:', conn.state);
      return;
    }

    try {
      console.log('Loading user conversations...');
      const userConversations = await conn.invoke('GetUserConversations');
      console.log('Conversations loaded:', userConversations);
      setConversations(userConversations || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(`Failed to load conversations: ${err.message}`);
    }
  };

  const loadConversationMessages = async (otherUserId, carId) => {
    if (!connection) {
      console.error('Cannot load messages: No connection object');
      setError('Chat connection not available. Please refresh the page.');
      return;
    }

    if (connection.state !== 'Connected') {
      console.log('Cannot load messages: Connection not in Connected state. Current state:', connection.state);
      
      const isDisconnected = connection.state === 'Disconnected';
      if (isDisconnected) {
        try {
          console.log('Trying to reconnect before loading messages...');
          const success = await startSignalRConnection(connection);
          if (!success) {
            setError('Failed to connect. Please try again later.');
            return;
          }
        } catch (err) {
          console.error('Failed to reconnect:', err);
          setError('Unable to reconnect. Please refresh the page.');
          return;
        }
      } else {
        setError(`Chat connection is ${connection.state}. Please try again in a moment.`);
        return;
      }
    }

    try {
      console.log('Loading conversation messages for user', otherUserId, 'car', carId);
      const conversation = await connection.invoke('GetConversationDetails', otherUserId, carId);
      console.log('Conversation details loaded:', conversation);
      
      // Create an active conversation object with all necessary properties
      const activeConversationData = {
        otherUserId: otherUserId,
        carId: carId,
        // If the backend sends otherUserName, use it, otherwise use otherUserId as fallback
        otherUserName: conversation.otherUserName || otherUserId,
        // If the backend sends carTitle, use it, otherwise use carId as fallback
        carTitle: conversation.carTitle || carId,
        // Check for various message property names the backend might use
        messages: conversation.recentMessages || conversation.messages || [],
        isOnline: conversation.isUserOnline || false,
        unreadCount: conversation.unreadCount || 0
      };
      
      setActiveConversation(activeConversationData);
      
      // Get messages from the correct property based on backend response
      const conversationMessages = conversation.recentMessages || conversation.messages || [];
      setMessages(conversationMessages);
      
      // Reset unread count for this conversation
      setUnreadCount(prev => Math.max(0, prev - (conversation.unreadCount || 0)));
    } catch (err) {
      console.error('Error loading conversation messages:', err);
      setError(`Failed to load messages: ${err.message}`);
    }
  };

  const sendMessage = async (receiverId, carId, message) => {
    if (!connection) {
      console.error('No connection available for sending message');
      setError('Chat connection not available. Please refresh the page.');
      return false;
    }

    console.log('Current connection state:', connection.state);
    
    if (connection.state !== 'Connected') {
      try {
        console.log('Connection not in connected state, attempting to reconnect...');
        const success = await startSignalRConnection(connection);
        if (!success) {
          setError('Failed to establish connection. Please try again later.');
          return false;
        }
        console.log('Successfully reconnected');
      } catch (err) {
        console.error('Failed to reconnect before sending message:', err);
        setError(`Connection error: ${err.message}`);
        return false;
      }
    }

    try {
      console.log('Sending message to', receiverId, 'about car', carId);
      await connection.invoke('SendCarInquiryMessage', receiverId, carId, message);
      console.log('Message sent successfully');
      
      // Refresh conversations to show the new message
      await loadUserConversations();
      
      if (activeConversation && 
          activeConversation.otherUserId === receiverId && 
          activeConversation.carId === carId) {
        await loadConversationMessages(receiverId, carId);
      }
      
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(`Failed to send message: ${err.message}`);
      return false;
    }
  };

  // Manual reconnect function that can be called by components
  const reconnect = async () => {
    // Get token using the helper function
    const token = getAuthToken();
    
    if (!user || !token) {
      console.error('No user or token, cannot reconnect');
      setError('You must be logged in to use chat features');
      return false;
    }
    
    if (!connection) {
      console.error('No connection to reconnect');
      
      // Try to recreate the connection since it's null
      try {
        console.log('Attempting to create a new connection...');
        
        // Extract the base URL correctly
        const baseUrlRegex = /\/api$/;
        const baseUrl = baseUrlRegex.test(API.BASE_URL) 
          ? API.BASE_URL.replace(baseUrlRegex, '')
          : API.BASE_URL.split('/api')[0];
        
        const connectionUrl = `${baseUrl}/hubs/chat`;
        
        const newConnection = new HubConnectionBuilder()
          .withUrl(connectionUrl, {
            accessTokenFactory: () => token,
            skipNegotiation: false,
            transport: HttpTransportType.WebSockets
          })
          .withAutomaticReconnect([0, 1000, 2000, 5000, 10000])
          .configureLogging(LogLevel.Information)
          .build();
          
        setConnection(newConnection);
        
        // Try to start the new connection
        console.log('Starting newly created connection...');
        const success = await startSignalRConnection(newConnection);
        if (success) {
          await loadUserConversations(newConnection);
          return true;
        } else {
          setError('Failed to start new connection. Please refresh the page.');
          return false;
        }
      } catch (err) {
        console.error('Failed to create new connection:', err);
        setError(`Connection error: ${err.message}`);
        return false;
      }
    }
    
    if (connection.state === 'Connected') {
      console.log('Already connected, no need to reconnect');
      return true;
    }
    
    try {
      console.log('Manually reconnecting existing connection...');
      setError('Attempting to reconnect...');
      const success = await startSignalRConnection(connection);
      if (success) {
        setError(null);
        await loadUserConversations();
        return true;
      } else {
        setError('Failed to reconnect. Please try again or refresh the page.');
        return false;
      }
    } catch (err) {
      console.error('Error during manual reconnection:', err);
      setError(`Reconnection failed: ${err.message}`);
      return false;
    }
  };

  const value = {
    conversations,
    activeConversation,
    messages,
    systemMessages,
    unreadCount,
    loading,
    error,
    connectionState,
    sendMessage,
    loadUserConversations,
    loadConversationMessages,
    setActiveConversation,
    connection,
    reconnect,
    clearError: () => setError(null)
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 