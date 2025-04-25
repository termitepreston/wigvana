import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
} from '@mui/material';
import { Link } from 'react-router-dom';

const DealsPage = () => {
  const deals = [
    {
      id: 1,
      title: "New Customer Special",
      description: "30% off your first purchase with code: WELCOME30",
      image: "/images/img1.jpg",
      expiryDate: "2024-04-30",
    },
    {
      id: 2,
      title: "Bundle & Save",
      description: "Buy 2 wigs, get 15% off your entire order",
      image: "/images/img2.jpg",
      expiryDate: "2024-04-15",
    },
    {
      id: 3,
      title: "Free Shipping Special",
      description: "Free shipping on orders over ETB 5,000",
      image: "/images/img3.jpg",
      expiryDate: "Ongoing",
    },
  ];

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#67442E' }}>
        Special Deals & Offers
      </Typography>

      <Grid container spacing={4}>
        {deals.map((deal) => (
          <Grid item key={deal.id} xs={12} md={4}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={deal.image}
                alt={deal.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" gutterBottom sx={{ color: '#67442E' }}>
                  {deal.title}
                </Typography>
                <Typography variant="body1" paragraph>
                  {deal.description}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Valid until: {deal.expiryDate}
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  to="/products"
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 2,
                    bgcolor: '#67442E',
                    '&:hover': {
                      bgcolor: '#523524',
                    },
                  }}
                >
                  Shop Now
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default DealsPage; 