import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments } from '@fortawesome/free-solid-svg-icons';
import { useChat } from '../../context/ChatContext';

const ChatButton = ({ className, onClick }) => {
  const { unreadCount } = useChat();
  
  return (
    <button 
      className={`position-relative btn ${className || 'btn-danger rounded-circle'}`}
      onClick={onClick}
    >
      <FontAwesomeIcon icon={faComments} className="fa-lg" />
      
      {unreadCount > 0 && (
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
          {unreadCount > 99 ? '99+' : unreadCount}
          <span className="visually-hidden">unread messages</span>
        </span>
      )}
    </button>
  );
};

export default ChatButton; 