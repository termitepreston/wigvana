import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Rating,
  Box,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import sellersData from '../data/sellers.json';
import productsData from '../data/products.json';

const SellerStorePage = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [sellerData, setSellerData] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        setLoading(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Find the seller in the sellers data
        const sellerId = parseInt(id, 10);
        const seller = sellersData.sellers.find(s => s.id === sellerId);
        
        if (!seller) {
          showToast('Seller not found', 'error');
          return;
        }
        
        // Find all products for this seller
        const products = productsData.products.filter(p => p.sellerId === sellerId);
        
        setSellerData(seller);
        setSellerProducts(products);
      } catch (error) {
        showToast('Failed to load seller data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [id, showToast]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '60vh' 
      }}>
        <CircularProgress sx={{ color: '#67442E' }} />
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      {/* Seller Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#67442E', mb: 2 }}>
          {sellerData.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Rating value={sellerData.rating} readOnly precision={0.5} />
          <Typography variant="body2" sx={{ ml: 1 }}>
            ({sellerData.reviewCount} reviews)
          </Typography>
          <Typography variant="body2" sx={{ ml: 2 }}>
            Seller since {sellerData.joinDate}
          </Typography>
        </Box>
        <Typography variant="body1">
          {sellerData.description}
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="Products" />
          <Tab label="Reviews" />
          <Tab label="About" />
        </Tabs>
      </Box>

      {/* Products Tab */}
      {currentTab === 0 && (
        <>
          {sellerProducts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No products found for this seller
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {sellerProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
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
                      image={product.image}
                      alt={product.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {product.name}
                      </Typography>
                      <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                        ETB {product.price.toLocaleString()}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating value={product.rating} readOnly precision={0.5} size="small" />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          ({product.reviewCount})
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {product.description.length > 100 
                          ? `${product.description.substring(0, 100)}...` 
                          : product.description}
                      </Typography>
                      <Button
                        component={Link}
                        to={`/products/${product.id}`}
                        variant="contained"
                        fullWidth
                        sx={{
                          bgcolor: '#67442E',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#523524',
                          },
                        }}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Reviews Tab */}
      {currentTab === 1 && (
        <Box>
          {sellerData.reviews && sellerData.reviews.length > 0 ? (
            sellerData.reviews.map((review) => (
              <Box key={review.id} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1">{review.userName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(review.date).toLocaleDateString()}
                  </Typography>
                </Box>
                <Rating value={review.rating} readOnly size="small" />
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {review.comment}
                </Typography>
                <Divider sx={{ mt: 2 }} />
              </Box>
            ))
          ) : (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              No reviews yet for this seller.
            </Typography>
          )}
        </Box>
      )}

      {/* About Tab */}
      {currentTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Store Policies
          </Typography>
          <Typography paragraph>
            We offer free shipping on orders over ETB 5,000. Returns are accepted within 7 days of delivery, provided the wig is unworn and in its original packaging.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            Contact Information
          </Typography>
          <Typography paragraph>
            Business hours: Monday-Saturday, 9:00 AM - 6:00 PM
            <br />
            Email: {sellerData.name.toLowerCase().replace(/\s+/g, '.')}@wigvana.com
            <br />
            Location: {sellerData.location || 'Addis Ababa, Ethiopia'}
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default SellerStorePage; 