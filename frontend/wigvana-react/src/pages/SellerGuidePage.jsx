import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Link } from 'react-router-dom';

const SellerGuidePage = () => {
  const sellerGuides = [
    {
      title: "Getting Started",
      content: `
        1. Create your seller account
        2. Complete your store profile
        3. Add your first product
        4. Set up payment information
      `
    },
    {
      title: "Product Guidelines",
      content: `
        • High-quality product images
        • Accurate product descriptions
        • Clear pricing information
        • Available sizes and colors
        • Shipping details
      `
    },
    {
      title: "Seller Policies",
      content: `
        • Maintain accurate inventory
        • Process orders within 24 hours
        • Respond to customer messages promptly
        • Handle returns professionally
        • Follow pricing guidelines
      `
    },
    {
      title: "Tips for Success",
      content: `
        • Keep your store page updated
        • Provide excellent customer service
        • Use high-quality product images
        • Offer competitive pricing
        • Engage with customer reviews
      `
    }
  ];

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#67442E' }}>
        Seller Guide
      </Typography>

      <Paper elevation={0} sx={{ p: 3, bgcolor: '#FBF7F4', mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Start Your Selling Journey
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to WigVana! This guide will help you set up your store and start selling successfully on our platform.
        </Typography>
        <Button
          component={Link}
          to="/become-seller"
          variant="contained"
          sx={{
            bgcolor: '#67442E',
            '&:hover': {
              bgcolor: '#523524',
            },
          }}
        >
          Become a Seller
        </Button>
      </Paper>

      {sellerGuides.map((guide, index) => (
        <Accordion key={index} sx={{ mb: 2 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              bgcolor: '#FBF7F4',
              '&:hover': {
                bgcolor: '#f5ede7',
              },
            }}
          >
            <Typography variant="h6">{guide.title}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              component="pre"
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                my: 0
              }}
            >
              {guide.content}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body1" paragraph>
          Ready to start selling?
        </Typography>
        <Button
          component={Link}
          to="/register?type=seller"
          variant="contained"
          size="large"
          sx={{
            bgcolor: '#67442E',
            '&:hover': {
              bgcolor: '#523524',
            },
          }}
        >
          Register as Seller
        </Button>
      </Box>
    </Container>
  );
};

export default SellerGuidePage; 