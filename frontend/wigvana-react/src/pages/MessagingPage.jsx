import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Button,
  Box,
  Divider,
  IconButton,
  Badge,
  CircularProgress,
  Chip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MessageIcon from '@mui/icons-material/Message';
import StoreIcon from '@mui/icons-material/Store';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useAuth } from '../context/AuthContext';
import { useMessaging } from '../context/MessagingContext';
import { useToast } from '../context/ToastContext';
import sellersData from '../data/sellers.json';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DoneIcon from '@mui/icons-material/Done';

// Background colors for chat avatars when no image is available
const avatarColors = [
  '#67442E', // Brown (primary theme color)
  '#9C6644', // Lighter brown
  '#D7A86E', // Tan
  '#8B4513', // Saddle brown
  '#A0522D', // Sienna
];

// Implement a component to try multiple image sources
const StoreImage = ({ imageOptions, alt, style, onError }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (currentImageIndex < imageOptions.length - 1) {
      const timer = setTimeout(() => {
        setCurrentImageIndex(currentImageIndex + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentImageIndex, imageOptions.length]);

  return (
    <img
      src={imageOptions[currentImageIndex]}
      alt={alt}
      style={style}
      onError={(e) => {
        if (currentImageIndex < imageOptions.length - 1) {
          setCurrentImageIndex(currentImageIndex + 1);
        } else if (onError) {
          onError(e);
        }
      }}
    />
  );
};

const MessagingPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { 
    conversations, 
    sendMessage, 
    getConversationMessages, 
    markAsRead,
    isConnected,
    setTyping,
    typingUsers 
  } = useMessaging();
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState({});
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Load participant information (names instead of IDs)
  useEffect(() => {
    if (conversations.length > 0) {
      const tempParticipants = {};
      
      conversations.forEach((conversation, index) => {
        const sellerId = parseInt(conversation.participantId, 10);
        if (!tempParticipants[sellerId]) {
          // Try to find the seller in the sellers data
          const sellerData = sellersData.sellers.find(s => s.id === sellerId);
          
          // Get a deterministic but varied banner index based on the seller's id
          const bannerIndex = (sellerId % 5) + 1; // Use modulo to get a number between 1-5
          
          // Use the store image folder path from the screenshot with multiple fallbacks
          const storeImageOptions = [
            `/images/store image/store image.jpg`,
            `/images/store image/banner.jpg`,
            `/images/img${bannerIndex}.jpg`
          ];
          
          tempParticipants[conversation.participantId] = {
            name: sellerData ? sellerData.name : `Store ${sellerId}`,
            avatar: sellerData ? sellerData.name.charAt(0).toUpperCase() : sellerId.toString().charAt(0),
            storeImageOptions: storeImageOptions,
            location: sellerData ? sellerData.location || 'Ethiopia' : `Location ${index + 1}`,
            color: avatarColors[index % avatarColors.length]
          };
        }
      });
      
      setParticipants(tempParticipants);
    }
  }, [conversations]);

  // Get participant name from ID
  const getParticipantName = (id) => {
    if (participants[id]) {
      return participants[id].name;
    }
    // Fallback to ID if name not found
    return `User ${id}`;
  };

  // Get participant avatar from ID
  const getParticipantAvatar = (id) => {
    if (participants[id]) {
      return participants[id].avatar;
    }
    return id.charAt(0).toUpperCase();
  };

  // Get participant image from ID
  const getParticipantImage = (participantId) => {
    const participant = participants[participantId];
    // Just check if the participant has image options
    return participant && participant.storeImageOptions && participant.storeImageOptions.length > 0;
  };

  // Get avatar background color
  const getAvatarColor = (id) => {
    if (participants[id] && participants[id].color) {
      return participants[id].color;
    }
    return '#67442E'; // Default brown
  };

  // Get participant location
  const getParticipantLocation = (id) => {
    if (participants[id] && participants[id].location) {
      return participants[id].location;
    }
    return 'Ethiopia';
  };

  // Set messages when a conversation is selected
  useEffect(() => {
    if (selectedChat) {
      setLoading(true);
      try {
        const messages = getConversationMessages(selectedChat.participantId);
        setChatMessages(messages);
        
        // Mark messages in this conversation as read
        const unreadMsgIds = messages
          .filter(msg => !msg.read && msg.receiverId === user.id)
          .map(msg => msg.id);
        
        if (unreadMsgIds.length > 0) {
          markAsRead(unreadMsgIds);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [selectedChat, getConversationMessages, markAsRead, user.id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);

    // Handle typing indicator
    if (selectedChat) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Send typing status
      setTyping(selectedChat.participantId, true);

      // Set timeout to clear typing status
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(selectedChat.participantId, false);
      }, 2000);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      sendMessage(selectedChat.participantId, null, newMessage);
      setNewMessage('');
      
      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setTyping(selectedChat.participantId, false);
      
      // Refresh the messages
      const updatedMessages = getConversationMessages(selectedChat.participantId);
      setChatMessages(updatedMessages);
    } catch (error) {
      showToast('Failed to send message', 'error');
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#67442E', fontWeight: 'bold' }}>
        Messages {!isConnected && <Typography component="span" color="error">(Offline)</Typography>}
      </Typography>

      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 2, 
          overflow: 'hidden',
          height: '75vh',
        }}
      >
        <Grid container sx={{ height: '100%' }}>
        {/* Conversations List */}
          <Grid item xs={12} md={4} sx={{ 
            borderRight: '1px solid #e0e0e0',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" sx={{ color: '#67442E' }}>
                Conversations
              </Typography>
            </Box>
            
            {conversations.length === 0 ? (
              <Box sx={{ 
                flex: 1,
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center',
                padding: 3,
                textAlign: 'center'
              }}>
                <MessageIcon sx={{ fontSize: 64, color: '#67442E', opacity: 0.5, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No conversations yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start a conversation from a product page
                </Typography>
              </Box>
            ) : (
              <List sx={{ 
                flex: 1, 
                overflow: 'auto', 
                p: 0,
                '& .MuiListItem-root.Mui-selected': {
                  bgcolor: '#f5e6e0',
                  borderLeft: '4px solid #67442E',
                },
                '& .MuiListItem-root:hover': {
                  bgcolor: '#f9f1ec',
                }
              }}>
              {conversations.map((conv) => (
                <React.Fragment key={conv.id}>
                  <ListItem 
                    button
                      alignItems="flex-start"
                    selected={selectedChat?.id === conv.id}
                    onClick={() => setSelectedChat(conv)}
                      sx={{ py: 1.5, px: 2 }}
                  >
                    <ListItemAvatar>
                      <Badge 
                        badgeContent={conv.unreadCount} 
                        color="error"
                        invisible={conv.unreadCount === 0}
                          sx={{
                            '& .MuiBadge-badge': {
                              top: 5,
                              right: 5,
                            }
                          }}
                        >
                          {getParticipantImage(conv.participantId) ? (
                            <Avatar 
                              sx={{ 
                                width: 50, 
                                height: 50,
                                border: '2px solid #f0f0f0',
                                bgcolor: getAvatarColor(conv.participantId),
                              }}
                            >
                              <StoreImage 
                                imageOptions={participants[conv.participantId].storeImageOptions}
                                alt={getParticipantName(conv.participantId)}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={() => {
                                  // Show avatar letter when all image options fail
                                  const avatarElement = document.querySelector(`[data-participant-id="${conv.participantId}"]`);
                                  if (avatarElement) {
                                    avatarElement.innerText = getParticipantAvatar(conv.participantId);
                                  }
                                }}
                              />
                            </Avatar>
                          ) : (
                            <Avatar
                              sx={{
                                width: 50,
                                height: 50,
                                bgcolor: getAvatarColor(conv.participantId),
                                fontSize: '1.25rem',
                                fontWeight: 'bold'
                              }}
                              data-participant-id={conv.participantId}
                            >
                              {getParticipantAvatar(conv.participantId)}
                            </Avatar>
                          )}
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ 
                                fontWeight: conv.unreadCount > 0 ? 'bold' : 'medium', 
                                color: '#67442E'
                              }}
                            >
                              {getParticipantName(conv.participantId)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {conv.lastMessage?.timestamp && 
                                formatMessageDate(conv.lastMessage.timestamp)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            {conv.isTyping ? (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: '#67442E',
                                  fontStyle: 'italic'
                                }}
                              >
                                Typing...
                              </Typography>
                            ) : (
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                noWrap
                                sx={{ 
                                  maxWidth: '100%',
                                  display: 'block',
                                  mt: 0.5,
                                  fontWeight: conv.unreadCount > 0 ? 'medium' : 'normal',
                                  color: conv.unreadCount > 0 ? '#555' : 'inherit',
                                }}
                              >
                                {conv.lastMessage?.message}
                              </Typography>
                            )}
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                mt: 0.5 
                              }}
                            >
                              <StoreIcon sx={{ color: '#67442E', fontSize: '0.9rem', mr: 0.5 }} />
                              <Typography variant="caption" color="text.secondary">
                                {getParticipantLocation(conv.participantId)}
                              </Typography>
                              {conv.unreadCount > 0 && (
                                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                                  <FiberManualRecordIcon sx={{ color: '#67442E', fontSize: '0.8rem', mr: 0.5 }} />
                                  <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold', color: '#67442E' }}>
                                    {conv.unreadCount} new
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        }
                    />
                  </ListItem>
                    <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
            )}
        </Grid>

        {/* Chat Window */}
          <Grid item xs={12} md={8} sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#f9f9f9'
          }}>
            {!selectedChat ? (
              <Box sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: 3 
              }}>
                <Box 
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    borderRadius: '50%', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f5e6e0',
                    mb: 3
                  }}
                >
                  <MessageIcon sx={{ fontSize: 60, color: '#67442E' }} />
                </Box>
                <Typography variant="h6" sx={{ color: '#67442E', mb: 1 }}>
                  Your Messages
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Select a conversation to start messaging
                </Typography>
              </Box>
            ) : (
              <>
                {/* Chat Header */}
                <Box sx={{ 
                  p: 2, 
                  bgcolor: '#f5e6e0', 
                  borderBottom: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {getParticipantImage(selectedChat.participantId) ? (
                    <Avatar 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        mr: 2,
                        bgcolor: getAvatarColor(selectedChat.participantId),
                      }}
                    >
                      <StoreImage 
                        imageOptions={participants[selectedChat.participantId].storeImageOptions}
                        alt={getParticipantName(selectedChat.participantId)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => {
                          // Show avatar letter when all image options fail
                          const avatarElement = document.querySelector(`[data-header-participant-id="${selectedChat.participantId}"]`);
                          if (avatarElement) {
                            avatarElement.innerText = getParticipantAvatar(selectedChat.participantId);
                          }
                        }}
                      />
                    </Avatar>
                  ) : (
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        mr: 2,
                        bgcolor: getAvatarColor(selectedChat.participantId)
                      }}
                      data-header-participant-id={selectedChat.participantId}
                    >
                      {getParticipantAvatar(selectedChat.participantId)}
                    </Avatar>
                  )}
                  <Box>
                    <Typography variant="h6" sx={{ color: '#67442E', fontWeight: 'bold' }}>
                      {getParticipantName(selectedChat.participantId)}
                  </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <StoreIcon sx={{ color: '#67442E', fontSize: '0.9rem', mr: 0.5 }} />
                      <Typography variant="caption" sx={{ color: '#67442E' }}>
                        {getParticipantLocation(selectedChat.participantId)}
                  </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Messages */}
                <Box sx={{ 
                  flex: 1, 
                  overflow: 'auto', 
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: '#fff'
                }}>
                  {loading ? (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      height: '100%' 
                    }}>
                      <CircularProgress sx={{ color: '#67442E' }} />
                    </Box>
                  ) : chatMessages.length === 0 ? (
                    <Box sx={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center' 
                    }}>
                      <Box 
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          borderRadius: '50%', 
                          bgcolor: '#f5e6e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2
                        }}
                      >
                        <MessageIcon sx={{ fontSize: 40, color: '#67442E' }} />
                      </Box>
                      <Typography variant="h6" sx={{ color: '#67442E', mb: 1 }}>
                        No messages yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Start the conversation below
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      {chatMessages.map((message, index) => {
                        // Check if we need to show a date divider
                        const showDateDivider = index === 0 || 
                          new Date(message.timestamp).toDateString() !== 
                          new Date(chatMessages[index - 1].timestamp).toDateString();
                          
                        return (
                          <React.Fragment key={message.id}>
                            {showDateDivider && (
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                my: 2 
                              }}>
                                <Chip 
                                  label={formatMessageDate(message.timestamp)} 
                                  size="small"
                                  sx={{ 
                                    bgcolor: '#f5e6e0', 
                                    color: '#67442E',
                                    fontWeight: 'medium' 
                                  }} 
                                />
                              </Box>
                            )}
                            <Box
                              sx={{
                                alignSelf: message.senderId === user.id ? 'flex-end' : 'flex-start',
                                maxWidth: '75%',
                                mb: 1.5,
                                display: 'flex',
                                flexDirection: message.senderId === user.id ? 'row-reverse' : 'row',
                                alignItems: 'flex-end',
                              }}
                            >
                              {message.senderId !== user.id && (
                                <Avatar
                      sx={{
                                    width: 32, 
                                    height: 32, 
                                    mx: 1,
                                    bgcolor: getAvatarColor(message.senderId)
                                  }}
                                >
                                  {getParticipantAvatar(message.senderId)}
                                </Avatar>
                              )}
                      <Paper
                                elevation={0}
                        sx={{
                          p: 2,
                                  borderRadius: message.senderId === user.id 
                                    ? '12px 12px 0 12px' 
                                    : '12px 12px 12px 0',
                                  bgcolor: message.senderId === user.id ? '#67442E' : '#f5e6e0',
                                  color: message.senderId === user.id ? 'white' : 'inherit',
                        }}
                      >
                        <Typography variant="body1">
                                  {message.message}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'flex-end',
                          mt: 1,
                          gap: 0.5,
                        }}>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {formatTimestamp(message.timestamp)}
                          </Typography>
                          {message.senderId === user.id && (
                            message.read ? (
                              <DoneAllIcon sx={{ fontSize: 16, opacity: 0.7 }} />
                            ) : (
                              <DoneIcon sx={{ fontSize: 16, opacity: 0.7 }} />
                            )
                          )}
                        </Box>
                      </Paper>
                    </Box>
                          </React.Fragment>
                        );
                      })}
                    </>
                  )}
                </Box>

                {/* Message Input */}
                <Box sx={{ 
                  p: 2, 
                  borderTop: '1px solid #e0e0e0', 
                  display: 'flex',
                  bgcolor: '#fff'
                }}>
                      <TextField
                        fullWidth
                    placeholder="Type your message..."
                        value={newMessage}
                        onChange={handleMessageChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    variant="outlined"
                    size="small"
                    disabled={!isConnected}
                    sx={{ 
                      mr: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 4,
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#67442E',
                        },
                      },
                    }}
                  />
                      <IconButton 
                    color="primary" 
                        onClick={handleSendMessage}
                    disabled={!isConnected || !newMessage.trim()}
                        sx={{ 
                          bgcolor: '#67442E',
                          color: 'white',
                      '&:hover': {
                        bgcolor: '#523524',
                      },
                      '&.Mui-disabled': {
                        bgcolor: '#cccccc',
                        color: '#666666',
                      },
                        }}
                      >
                        <SendIcon />
                      </IconButton>
                </Box>
              </>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default MessagingPage; 