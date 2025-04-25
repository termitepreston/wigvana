import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Card,
  CardMedia,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Rating,
  Avatar,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import StoreIcon from '@mui/icons-material/Store';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useMessaging } from '../context/MessagingContext';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedLength, setSelectedLength] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [product, setProduct] = useState(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  const { sendMessage } = useMessaging();

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch('/src/data/products.json');
        const data = await response.json();
        
        console.log("Loaded products:", data);
        const foundProduct = data.products.find(p => p.id.toString() === id);
        
        if (foundProduct) {
          setProduct(foundProduct);
          setCurrentPrice(foundProduct.price);
        } else {
          showToast('Product not found', 'error');
          navigate('/products');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        showToast('Failed to load product details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id, navigate, showToast]);

  const calculatePriceByLength = (length) => {
    if (!product) return 0;
    
    // Base price is for the shortest length (16 inch)
    const basePrice = product.price;
    
    // Price increases by length
    switch (length) {
      case '16 inch':
        return basePrice;
      case '18 inch':
        return basePrice + 500;
      case '20 inch':
        return basePrice + 1000;
      case '22 inch':
        return basePrice + 1500;
      case '24 inch':
        return basePrice + 2000;
      case '26 inch':
        return basePrice + 2500;
      default:
        return basePrice;
    }
  };

  const handleLengthChange = (event) => {
    const newLength = event.target.value;
    setSelectedLength(newLength);
    setCurrentPrice(calculatePriceByLength(newLength));
  };

  const handleAddToCart = async () => {
    // First check if user is logged in
    if (!isAuthenticated) {
      showToast('Please login to add items to cart', 'warning');
      navigate('/login');
      return;
    }

    if (!selectedLength || !selectedColor) {
      showToast('Please select both length and color', 'error');
      return;
    }

    try {
      setAddingToCart(true);
      
      // Create cart item with selected options and current price
      const cartItem = {
        ...product,
        selectedLength,
        selectedColor,
        price: currentPrice,
        quantity: 1,
      };
      
      // Add to cart
      await addToCart(cartItem);
      showToast('Added to cart successfully!', 'success');
    } catch (error) {
      showToast('Failed to add to cart', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      showToast('Please login to contact the seller', 'warning');
      navigate('/login');
      return;
    }
    
    setMessageDialogOpen(true);
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      showToast('Please enter a message', 'warning');
      return;
    }
    
    try {
      // Ensure we're passing the seller ID correctly
      // Convert to number if it's stored as a string in the product data
      const sellerId = typeof product.sellerId === 'string' 
        ? parseInt(product.sellerId, 10) 
        : product.sellerId;
      
      // Use the messaging context to send and save the message
      sendMessage(sellerId.toString(), product.id, message);
      
      showToast('Message sent to seller', 'success');
      setMessageDialogOpen(false);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message. Please try again.', 'error');
    }
  };

  const visitSellerStore = () => {
    navigate(`/seller/${product.sellerId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!product) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography variant="h5" color="error">Product not found</Typography>
        <Button component={Link} to="/products" sx={{ mt: 2 }}>
          Return to Products
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#F5E6E0', py: 4 }}>
      <Container>
        <Grid container spacing={4}>
          {/* Product Image */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardMedia
                component="img"
                height="500"
                image={product.image}
                alt={product.name}
                sx={{ objectFit: 'cover' }}
              />
            </Card>
          </Grid>

          {/* Product Details */}
          <Grid item xs={12} md={6}>
            <Typography variant="h4" sx={{ color: '#67442E', mb: 2 }}>
              {product.name}
            </Typography>
            
            {/* Seller Information */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2, 
                pb: 2, 
                borderBottom: '1px solid #e0e0e0' 
              }}
            >
              <Avatar 
                src="/images/avatar1.jpg" 
                sx={{ width: 40, height: 40, mr: 2 }}
              />
              <Box>
                <Typography variant="subtitle1">
                  {product.sellerName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Rating value={product.rating} readOnly size="small" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    ({product.reviewCount} reviews)
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined"
                  startIcon={<StoreIcon />}
                  size="small"
                  onClick={visitSellerStore}
                  sx={{ borderColor: '#67442E', color: '#67442E' }}
                >
                  Visit Store
                </Button>
                <Button 
                  variant="outlined"
                  startIcon={<ChatIcon />}
                  size="small"
                  onClick={handleContactSeller}
                  sx={{ borderColor: '#67442E', color: '#67442E' }}
                >
                  Contact
                </Button>
              </Box>
            </Box>

            <Typography variant="h4" sx={{ color: '#67442E', fontWeight: 600, mb: 3 }}>
              ETB {currentPrice.toLocaleString()}
            </Typography>

            <Typography variant="body1" sx={{ mb: 3 }}>
              {product.description}
            </Typography>

            {/* Length Selection */}
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Select Length:
            </Typography>
            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
              <RadioGroup
                value={selectedLength}
                onChange={handleLengthChange}
                sx={{ flexDirection: 'row', flexWrap: 'wrap' }}
              >
                {product.availableLengths?.map((length) => (
                  <FormControlLabel
                    key={length}
                    value={`${length} inch`}
                    control={<Radio color="primary" />}
                    label={`${length}"`}
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      m: 0.5,
                      px: 1,
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            {/* Color Selection */}
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Select Color:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              {product.availableColors?.map((color) => (
                <Box
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: color === 'Natural Black' ? '#000000' 
                           : color === 'Dark Brown' ? '#3b2314'
                           : color === 'Brown' ? '#964B00'
                           : color === 'Blonde' ? '#f7dc6f'
                           : color,
                    border: selectedColor === color ? '3px solid #67442E' : '1px solid #e0e0e0',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                />
              ))}
            </Box>

            {/* Add to Cart Button */}
            <Button
              fullWidth
              variant="contained"
              startIcon={<ShoppingCartIcon />}
              onClick={handleAddToCart}
              disabled={!selectedLength || !selectedColor || addingToCart}
              sx={{
                bgcolor: '#67442E',
                color: 'white',
                py: 1.5,
                mb: 2,
                '&:hover': {
                  bgcolor: '#523524',
                },
                '&.Mui-disabled': {
                  bgcolor: '#cccccc',
                },
              }}
            >
              {addingToCart ? <CircularProgress size={24} color="inherit" /> : 'Add to Cart'}
            </Button>

            {/* Selection Requirements */}
            {(!selectedLength || !selectedColor) && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'red', 
                  mt: 1, 
                  textAlign: 'center' 
                }}
              >
                Please select both length and color
              </Typography>
            )}
          </Grid>
        </Grid>

        {/* Product Details Section */}
        <Box sx={{ mt: 6, mb: 6 }}>
          <Typography variant="h5" sx={{ color: '#67442E', mb: 3 }}>
            Product Details
          </Typography>
          <Paper sx={{ p: 3, bgcolor: 'white' }}>
            <Typography variant="body1" sx={{ color: '#67442E', mb: 3 }}>
              {product.description}
            </Typography>
            <Typography variant="h6" sx={{ color: '#67442E', mb: 2 }}>
              Features:
            </Typography>
            <Grid container spacing={2}>
              {product.features?.map((feature, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: '#67442E',
                      display: 'flex',
                      alignItems: 'center',
                      '&:before': {
                        content: '"•"',
                        marginRight: 1,
                        color: '#67442E',
                      }
                    }}
                  >
                    {feature}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>

        {/* Customer Reviews Section */}
        <Box>
          <Typography variant="h5" sx={{ color: '#67442E', mb: 3 }}>
            Customer Reviews
          </Typography>
          <Grid container spacing={3}>
            {/* Mock reviews */}
            {[1, 2, 3].map((reviewId) => (
              <Grid item xs={12} key={reviewId}>
                <Paper sx={{ p: 3, bgcolor: 'white' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      src={`/images/avatar${reviewId}.jpg`}
                      sx={{ width: 48, height: 48, mr: 2 }}
                    />
                    <Box>
                      <Typography variant="subtitle1" sx={{ color: '#67442E', fontWeight: 600 }}>
                        {reviewId === 1 ? 'Sarah Johnson' : reviewId === 2 ? 'Michelle Davis' : 'Jessica Williams'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={reviewId === 2 ? 4 : 5} readOnly size="small" sx={{ mr: 1 }} />
                        <Typography variant="body2" sx={{ color: '#67442E' }}>
                          {`March ${15 - (reviewId * 5)}, 2024`}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Typography variant="body1" sx={{ color: '#67442E' }}>
                    {reviewId === 1 
                      ? 'Absolutely love this wig! The quality is amazing and it looks so natural. Worth every penny.'
                      : reviewId === 2 
                      ? 'Great wig, very comfortable to wear. The hair quality is excellent. Just needed minor adjustments.'
                      : 'This is my second purchase from this store. The quality is consistent and the customer service is excellent!'}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onClose={() => setMessageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Contact Seller
          <IconButton
            aria-label="close"
            onClick={() => setMessageDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              To: {product.sellerName}
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Product: {product.name}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about availability, customization options, etc."
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSendMessage}
            variant="contained"
            sx={{ bgcolor: '#67442E', '&:hover': { bgcolor: '#523524' } }}
          >
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductDetailsPage; 