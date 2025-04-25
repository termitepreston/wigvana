import React from 'react';
import { Box, Container, Grid, Typography, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <Box sx={{ bgcolor: '#FBF7F4', py: 6, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ color: '#67442E', mb: 2 }}>
              WigVana
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ethiopia's premier marketplace for quality wigs.
              Find your perfect style from our verified sellers.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ color: '#67442E', mb: 2 }}>
              Shop
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <MuiLink component={Link} to="/products" sx={{ mb: 1, color: 'inherit' }}>
                All Wigs
              </MuiLink>
              <MuiLink component={Link} to="/sellers" sx={{ mb: 1, color: 'inherit' }}>
                Sellers
              </MuiLink>
              <MuiLink component={Link} to="/deals" sx={{ mb: 1, color: 'inherit' }}>
                Deals
              </MuiLink>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ color: '#67442E', mb: 2 }}>
              Sell
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <MuiLink component={Link} to="/become-seller" sx={{ mb: 1, color: 'inherit' }}>
                Start Selling
              </MuiLink>
              <MuiLink component={Link} to="/seller-guide" sx={{ mb: 1, color: 'inherit' }}>
                Seller Guide
              </MuiLink>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ color: '#67442E', mb: 2 }}>
              Help
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <MuiLink component={Link} to="/faq" sx={{ mb: 1, color: 'inherit' }}>
                FAQ
              </MuiLink>
              <MuiLink component={Link} to="/shipping" sx={{ mb: 1, color: 'inherit' }}>
                Shipping
              </MuiLink>
              <MuiLink component={Link} to="/returns" sx={{ mb: 1, color: 'inherit' }}>
                Returns
              </MuiLink>
              <MuiLink component={Link} to="/contact" sx={{ mb: 1, color: 'inherit' }}>
                Contact Us
              </MuiLink>
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} WigVana. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 