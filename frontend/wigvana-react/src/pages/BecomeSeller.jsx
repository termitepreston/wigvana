import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress
} from '@mui/material';

const BecomeSeller = () => {
  const navigate = useNavigate();
  const { user, becomeSeller } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    description: '',
    phoneNumber: '',
    address: ''
  });

  useEffect(() => {
    // If user is already a seller with a completed profile, redirect to dashboard
    if (user?.isSeller && user?.isSellerProfileComplete) {
      navigate('/seller/dashboard', { replace: true });
    }
    // If no user is logged in, redirect to register page
    if (!user) {
      navigate('/register?type=seller', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      if (!formData.storeName || !formData.description || !formData.phoneNumber || !formData.address) {
        toast.error('Please fill in all required fields');
        return;
      }

      const success = await becomeSeller(formData);
      if (success) {
        toast.success('Successfully registered as a seller!');
        navigate('/seller/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Error registering as seller:', error);
      toast.error(error.message || 'Failed to register as seller');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: '#67442E' }}>
          Complete Your Seller Profile
        </Typography>
        <Typography variant="body1" paragraph align="center" color="text.secondary">
          Set up your store and start selling on WigVana
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            required
            label="Store Name"
            name="storeName"
            value={formData.storeName}
            onChange={handleChange}
            margin="normal"
            disabled={loading}
          />
          <TextField
            fullWidth
            required
            label="Store Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
            disabled={loading}
          />
          <TextField
            fullWidth
            required
            label="Phone Number"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            margin="normal"
            disabled={loading}
          />
          <TextField
            fullWidth
            required
            label="Business Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            margin="normal"
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ 
              mt: 3,
              bgcolor: '#67442E',
              '&:hover': {
                bgcolor: '#523524',
              }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Complete Registration'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default BecomeSeller; 