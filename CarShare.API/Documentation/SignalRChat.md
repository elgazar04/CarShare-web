# SignalR Real-Time Chat Documentation

This document describes how to implement and use the real-time chat functionality in the CarShare application.

## Hub Overview

The `ChatHub` located at `/hubs/chat` provides real-time communication between:
- Renters and Car Owners regarding specific car inquiries
- Any user and Admins for support requests

## Authentication

All hub methods require authentication. When connecting to the hub, provide your JWT token:

```javascript
// Example with @microsoft/signalr client
const connection = new signalR.HubConnectionBuilder()
  .withUrl("/hubs/chat?access_token=" + jwtToken)
  .build();
```

## Available Methods

### 1. Send Car Inquiry Message
Send a message from a renter to a car owner about a specific car.

```javascript
// Client calls this method
await connection.invoke("SendCarInquiryMessage", receiverId, carId, message);
```

Parameters:
- `receiverId` (string): The ID of the car owner
- `carId` (string): The ID of the car being inquired about
- `message` (string): The message content

**Note**: The message will always be sent back to the sender first, so you will see your own messages immediately.

### 2. Get Recent Car Messages
Retrieve recent messages for a specific car.

```javascript
// Client calls this method
const messages = await connection.invoke("GetRecentCarMessages", carId);
```

Parameters:
- `carId` (string): The ID of the car to get messages for

Returns:
- Array of message objects with:
  - `senderId`: The ID of the sender
  - `message`: The message content
  - `carId`: The ID of the car
  - `isOwnMessage`: Whether the message was sent by the current user
  - `timestamp`: When the message was sent

### 3. Get User Conversations
Get a list of all the user's active conversations.

```javascript
// Client calls this method
const conversations = await connection.invoke("GetUserConversations");
```

Returns:
- Array of conversation objects with:
  - `userId`: The ID of the other user in the conversation
  - `carId`: The ID of the car the conversation is about
  - `lastMessageTime`: Timestamp of the last message

### 4. Get Conversation Details
Get detailed information about a specific conversation, including recent messages.

```javascript
// Client calls this method
const conversationDetails = await connection.invoke("GetConversationDetails", otherUserId, carId);
```

Parameters:
- `otherUserId` (string): The ID of the other user in the conversation
- `carId` (string): The ID of the car the conversation is about

Returns:
- Conversation details object with:
  - `carId`: The ID of the car
  - `otherUserId`: The ID of the other user
  - `isUserOnline`: Whether the other user is currently online
  - `recentMessages`: Array of recent messages in the conversation
  - `groupName`: The internal group name for this conversation

### 5. Reply to Conversation
A simplified method to reply to an existing conversation.

```javascript
// Client calls this method
await connection.invoke("ReplyToConversation", otherUserId, carId, message);
```

Parameters:
- `otherUserId` (string): The ID of the user to reply to
- `carId` (string): The ID of the car the conversation is about
- `message` (string): The reply message content

### 6. Send Support Message
Send a support message from any user to all admins.

```javascript
// Client calls this method
await connection.invoke("SendSupportMessage", message);
```

Parameters:
- `message` (string): The support message content

**Note**: The message will always be sent back to the sender, so you will see your own messages immediately.

### 7. Send Admin Reply
For admins to reply to a specific user.

```javascript
// Client calls this method (admin only)
await connection.invoke("SendAdminReply", userId, message);
```

Parameters:
- `userId` (string): The ID of the user to reply to
- `message` (string): The reply message content

**Note**: The message will always be sent back to the admin sender, so you will see your own messages immediately.

## Client-Side Events

### Messages

1. `ReceiveMessage`: For car inquiry messages
```javascript
connection.on("ReceiveMessage", (senderId, message, carId) => {
  // Handle received message
  console.log(`Message from ${senderId} about car ${carId}: ${message}`);
  
  // Add to your local messages array
  const newMessage = {
    senderId,
    message,
    carId,
    isOwnMessage: senderId === currentUserId,
    timestamp: new Date().toISOString()
  };
  
  setMessages(prevMessages => [...prevMessages, newMessage]);
});
```

2. `ReceiveSupportMessage`: For support messages (admin only)
```javascript
connection.on("ReceiveSupportMessage", (senderId, message) => {
  // Handle support message (admin side)
  console.log(`Support request from ${senderId}: ${message}`);
});
```

3. `ReceiveAdminMessage`: For admin replies to users
```javascript
connection.on("ReceiveAdminMessage", (adminId, message) => {
  // Handle admin message
  console.log(`Admin ${adminId} replied: ${message}`);
});
```

4. `ReceiveSystemMessage`: System notifications
```javascript
connection.on("ReceiveSystemMessage", (message) => {
  // Handle system message
  console.log(`System: ${message}`);
});
```

### Notifications

The most important event for notifications is:

```javascript
connection.on("NewMessageNotification", (notification) => {
  // notification object contains: 
  // - senderId: ID of the message sender
  // - messagePreview: Short preview of the message content
  // - type: "CarInquiry", "Support", or "AdminReply"
  // - carId: Only for car inquiry messages
  // - timestamp: ISO timestamp of when notification was created
  
  // Display a notification to the user
  showNotification(notification);
});
```

## Implementing Client-Side Chat

### Basic Chat Implementation

```jsx
import { useState, useEffect, useRef } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';

function CarChat({ carId, receiverId }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Connect to SignalR hub when component mounts
  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl(`${apiUrl}/hubs/chat?access_token=${token}`)
      .withAutomaticReconnect()
      .build();
      
    // Set up event handlers
    newConnection.on('ReceiveMessage', (senderId, text, msgCarId) => {
      if (msgCarId === carId) {
        const newMsg = {
          senderId,
          message: text,
          timestamp: new Date().toISOString(),
          isOwnMessage: senderId === currentUserId
        };
        
        setMessages(prev => [...prev, newMsg]);
      }
    });
    
    newConnection.on('ReceiveSystemMessage', (text) => {
      const systemMsg = {
        isSystem: true,
        message: text,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, systemMsg]);
    });
    
    // Start connection and load recent messages
    const startConnection = async () => {
      try {
        await newConnection.start();
        console.log('SignalR connected');
        setConnection(newConnection);
        
        // Load recent messages
        const recentMessages = await newConnection.invoke('GetRecentCarMessages', carId);
        setMessages(recentMessages);
        setLoading(false);
      } catch (err) {
        console.error('Error connecting to SignalR:', err);
        setTimeout(startConnection, 5000);
      }
    };
    
    startConnection();
    
    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, [carId, receiverId, token, currentUserId]);
  
  // Send message
  const sendMessage = async () => {
    if (!message.trim() || !connection) return;
    
    try {
      await connection.invoke('SendCarInquiryMessage', receiverId, carId, message);
      setMessage(''); // Clear input after sending
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };
  
  return (
    <div className="chat-container">
      <div className="chat-messages">
        {loading ? (
          <div>Loading messages...</div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.isOwnMessage ? 'own-message' : ''} ${msg.isSystem ? 'system-message' : ''}`}
            >
              {msg.isSystem ? (
                <div className="system-text">{msg.message}</div>
              ) : (
                <>
                  <div className="message-header">
                    {!msg.isOwnMessage && <span>{msg.senderId}</span>}
                    <span className="timestamp">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="message-body">{msg.message}</div>
                </>
              )}
            </div>
          ))
        )}
      </div>
      
      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default CarChat;
```

### Conversations List Implementation

```jsx
import { useState, useEffect } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { useNavigate } from 'react-router-dom';

function ConversationsList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl(`${apiUrl}/hubs/chat?access_token=${token}`)
      .withAutomaticReconnect()
      .build();
      
    // Start connection and load conversations
    const startConnection = async () => {
      try {
        await newConnection.start();
        setConnection(newConnection);
        
        // Load user's conversations
        const userConversations = await newConnection.invoke('GetUserConversations');
        setConversations(userConversations);
        setLoading(false);
      } catch (err) {
        console.error('Error connecting to SignalR:', err);
        setTimeout(startConnection, 5000);
      }
    };
    
    startConnection();
    
    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, [token]);
  
  const handleConversationClick = (otherUserId, carId) => {
    navigate(`/chat/${carId}/${otherUserId}`);
  };
  
  if (loading) {
    return <div>Loading conversations...</div>;
  }
  
  return (
    <div className="conversations-list">
      <h2>Your Conversations</h2>
      
      {conversations.length === 0 ? (
        <p>No active conversations</p>
      ) : (
        <ul>
          {conversations.map((convo, index) => (
            <li 
              key={index} 
              onClick={() => handleConversationClick(convo.userId, convo.carId)}
              className="conversation-item"
            >
              <div>Conversation with User: {convo.userId}</div>
              <div>About Car: {convo.carId}</div>
              <div className="time-ago">
                {new Date(convo.lastMessageTime).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ConversationsList;
```

## Integration Notes

1. Include the chat component on your car details page to allow renters and owners to communicate
2. Add a conversations list component to help users find and continue their conversations
3. Messages are stored in-memory with a cap of 50 messages per car
4. Senders will always see their own messages immediately
5. The system handles offline messaging - messages will be delivered when users reconnect
6. Use the `ReplyToConversation` method for simpler replies when you already know the context 