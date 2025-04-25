import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import webSocketService from '../services/WebSocketService';

const MessagingContext = createContext();

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

// Mock data for initial messages
const mockMessages = [
  {
    id: '1',
    senderId: '1',
    receiverId: '2',
    message: 'Hello, I\'m interested in your wig.',
    timestamp: new Date('2024-03-28T10:00:00'),
    read: true,
  },
  {
    id: '2',
    senderId: '2',
    receiverId: '1',
    message: 'Hi! Which one are you interested in?',
    timestamp: new Date('2024-03-28T10:05:00'),
    read: false,
  },
];

export const MessagingProvider = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState(mockMessages);
  const [conversations, setConversations] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Map());

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (user) {
      webSocketService.connect(user.id);

      // Handle connection status
      webSocketService.on('connection', () => {
        setIsConnected(true);
      });

      // Handle incoming messages
      webSocketService.on('message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      // Handle typing status
      webSocketService.on('typing', ({ userId, isTyping }) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          if (isTyping) {
            newMap.set(userId, Date.now());
          } else {
            newMap.delete(userId);
          }
          return newMap;
        });
      });

      return () => {
        webSocketService.disconnect();
        setIsConnected(false);
      };
    }
  }, [user]);

  // Clean up typing indicators after 3 seconds of inactivity
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers(prev => {
        const now = Date.now();
        const newMap = new Map(prev);
        for (const [userId, timestamp] of newMap.entries()) {
          if (now - timestamp > 3000) {
            newMap.delete(userId);
          }
        }
        return newMap;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      // Group messages by conversation
      const userMessages = messages.filter(
        (msg) => msg.senderId === user.id || msg.receiverId === user.id
      );

      const conversationMap = new Map();

      userMessages.forEach((message) => {
        const otherUserId =
          message.senderId === user.id ? message.receiverId : message.senderId;

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            id: otherUserId,
            participantId: otherUserId,
            lastMessage: message,
            unreadCount: 0,
            isTyping: typingUsers.has(otherUserId),
          });
        }

        const conversation = conversationMap.get(otherUserId);
        if (
          message.timestamp > conversation.lastMessage.timestamp
        ) {
          conversation.lastMessage = message;
        }

        if (!message.read && message.receiverId === user.id) {
          conversation.unreadCount++;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    }
  }, [messages, user, typingUsers]);

  const sendMessage = (receiverId, productId, message) => {
    const newMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId,
      message,
      productId,
      timestamp: new Date(),
      read: false,
    };

    // Send message through WebSocket
    if (webSocketService.sendMessage(newMessage)) {
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    } else {
      throw new Error('Failed to send message');
    }
  };

  const markAsRead = (messageIds) => {
    setMessages((prev) =>
      prev.map((msg) =>
        messageIds.includes(msg.id) ? { ...msg, read: true } : msg
      )
    );

    // Notify through WebSocket that messages were read
    webSocketService.sendMessage({
      type: 'mark_read',
      messageIds,
    });
  };

  const setTyping = (receiverId, isTyping) => {
    webSocketService.sendMessage({
      type: 'typing',
      receiverId,
      isTyping,
    });
  };

  const getConversationMessages = (participantId) => {
    return messages.filter(
      (msg) =>
        (msg.senderId === user.id && msg.receiverId === participantId) ||
        (msg.senderId === participantId && msg.receiverId === user.id)
    ).sort((a, b) => a.timestamp - b.timestamp);
  };

  const getTotalUnreadCount = () => {
    if (!user) return 0;
    return messages.filter(
      (msg) => !msg.read && msg.receiverId === user.id
    ).length;
  };

  const value = {
    conversations,
    sendMessage,
    markAsRead,
    getConversationMessages,
    getTotalUnreadCount,
    isConnected,
    setTyping,
    typingUsers,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

export default MessagingContext; 