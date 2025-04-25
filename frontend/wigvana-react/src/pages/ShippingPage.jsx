import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const ShippingPage = () => {
  const shippingRates = [
    {
      region: "Addis Ababa",
      deliveryTime: "2-3 business days",
      cost: "Free for orders over ETB 5,000",
      standardRate: "ETB 200",
    },
    {
      region: "Other Major Cities",
      deliveryTime: "3-5 business days",
      cost: "ETB 300",
      standardRate: "ETB 300",
    },
    {
      region: "Other Regions",
      deliveryTime: "5-7 business days",
      cost: "ETB 400",
      standardRate: "ETB 400",
    },
  ];

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#67442E' }}>
        Shipping Information
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', bgcolor: '#FBF7F4' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocalShippingIcon sx={{ fontSize: 40, color: '#67442E', mr: 2 }} />
              <Typography variant="h6">
                Free Shipping
              </Typography>
            </Box>
            <Typography variant="body1">
              Enjoy free shipping on all orders over ETB 5,000 within Addis Ababa.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', bgcolor: '#FBF7F4' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccessTimeIcon sx={{ fontSize: 40, color: '#67442E', mr: 2 }} />
              <Typography variant="h6">
                Delivery Time
              </Typography>
            </Box>
            <Typography variant="body1">
              Most orders are delivered within 2-7 business days depending on your location.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', bgcolor: '#FBF7F4' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocationOnIcon sx={{ fontSize: 40, color: '#67442E', mr: 2 }} />
              <Typography variant="h6">
                Nationwide Delivery
              </Typography>
            </Box>
            <Typography variant="body1">
              We deliver to all regions in Ethiopia through our trusted courier partners.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" sx={{ mb: 3, color: '#67442E' }}>
          Shipping Rates & Delivery Times
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#FBF7F4' }}>
                <TableCell>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Region</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Delivery Time</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Cost</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Standard Rate</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shippingRates.map((rate, index) => (
                <TableRow key={index}>
                  <TableCell>{rate.region}</TableCell>
                  <TableCell>{rate.deliveryTime}</TableCell>
                  <TableCell>{rate.cost}</TableCell>
                  <TableCell>{rate.standardRate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Paper sx={{ mt: 6, p: 3, bgcolor: '#FBF7F4' }}>
        <Typography variant="h6" gutterBottom>
          Important Shipping Information
        </Typography>
        <Typography variant="body1" paragraph>
          • Orders are processed and shipped Monday through Saturday (excluding holidays)
        </Typography>
        <Typography variant="body1" paragraph>
          • You will receive a tracking number once your order is shipped
        </Typography>
        <Typography variant="body1" paragraph>
          • Delivery times may vary during peak seasons or due to unforeseen circumstances
        </Typography>
        <Typography variant="body1">
          • For any shipping-related queries, please contact our customer service at support@wigvana.com
        </Typography>
      </Paper>
    </Container>
  );
};

export default ShippingPage; 