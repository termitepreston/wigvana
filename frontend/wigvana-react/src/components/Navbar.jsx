import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Button, Typography, IconButton, MenuItem, Badge } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MessageIcon from '@mui/icons-material/Message';
import { useAuth } from '../context/AuthContext';
import { useMessaging } from '../context/MessagingContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getTotalUnreadCount } = useMessaging();

  const handleCloseUserMenu = () => {
    // Implement the logic to close the user menu
  };

  return (
    <Box sx={{ 
      bgcolor: 'white', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      py: 2
    }}>
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/images/logo.png" alt="WigVana" style={{ height: 40 }} />
            <Box sx={{ color: '#67442E', fontSize: '1.5rem', fontWeight: 600, ml: 1 }}>
              WigVana
            </Box>
          </Link>

          {/* Navigation Links */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#67442E' }}>
              Home
            </Link>
            <Link 
              to="/products" 
              style={{ 
                textDecoration: 'none', 
                color: 'inherit' 
              }}
            >
              Explore
            </Link>
            <Link to="/sellers" style={{ textDecoration: 'none', color: '#67442E' }}>
              Sellers
            </Link>
            <Link to="/about" style={{ textDecoration: 'none', color: '#67442E' }}>
              About Us
            </Link>
            <Link to="/contact" style={{ textDecoration: 'none', color: '#67442E' }}>
              Contact
            </Link>
            {user && (
              <>
                <Link to="/cart" style={{ textDecoration: 'none', color: '#67442E' }}>
                  <ShoppingCartIcon />
                </Link>
                <Link to="/messages" style={{ textDecoration: 'none', color: '#67442E' }}>
                  <IconButton color="inherit">
                    <Badge badgeContent={getTotalUnreadCount()} color="error">
                      <MessageIcon />
                    </Badge>
                  </IconButton>
                </Link>
              </>
            )}
            {user?.role === 'seller' && (
              <Link to="/seller/dashboard" style={{ textDecoration: 'none', color: '#67442E' }}>
                My Store
              </Link>
            )}
            {user ? (
              <>
                <Typography sx={{ color: '#67442E' }}>
                  {user.name}
                </Typography>
                <Button 
                  onClick={logout}
                  sx={{ color: '#67442E' }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Button sx={{ color: '#67442E' }}>
                    Login
                  </Button>
                </Link>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      bgcolor: '#67442E',
                      color: 'white',
                      '&:hover': {
                        bgcolor: '#523524',
                      },
                    }}
                  >
                    Register
                  </Button>
                </Link>
              </>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Navbar; 