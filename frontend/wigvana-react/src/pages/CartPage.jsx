import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Button,
  Grid,
  TextField,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const handleQuantityChange = (item, newQuantity) => {
    updateQuantity(item.productId, item.selectedLength, item.selectedColor, newQuantity);
  };

  const handleRemoveItem = (item) => {
    removeFromCart(item.productId, item.selectedLength, item.selectedColor);
  };

  const handleCheckout = () => {
    // Simulate checkout - in real app, this would navigate to checkout page
    alert('Checkout functionality would be implemented here');
  };

  if (cartItems.length === 0) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ mb: 4, color: '#67442E' }}>
          Your Cart is Empty
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/products')}
          sx={{
            bgcolor: '#67442E',
            '&:hover': { bgcolor: '#523524' },
          }}
        >
          Continue Shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#67442E' }}>
        Shopping Cart
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {cartItems.map((item) => (
            <Card key={`${item.productId}-${item.selectedLength}-${item.selectedColor}`} sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={3}>
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '100px',
                        objectFit: 'cover',
                      }}
                    />
                  </Grid>
                  <Grid item xs={9}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: '#67442E' }}>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Length: {item.selectedLength} inches
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Color: {item.selectedColor}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          ${item.price.toFixed(2)}
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={() => handleRemoveItem(item)}
                        sx={{ color: '#67442E' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <IconButton
                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        size="small"
                        sx={{ color: '#67442E' }}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <TextField
                        value={item.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value > 0) {
                            handleQuantityChange(item, value);
                          }
                        }}
                        type="number"
                        size="small"
                        inputProps={{ min: 1, style: { textAlign: 'center' } }}
                        sx={{ width: '60px', mx: 1 }}
                      />
                      <IconButton
                        onClick={() => handleQuantityChange(item, item.quantity + 1)}
                        size="small"
                        sx={{ color: '#67442E' }}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#67442E', mb: 2 }}>
                Order Summary
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal</Typography>
                  <Typography>${getCartTotal().toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Shipping</Typography>
                  <Typography>Free</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6">${getCartTotal().toFixed(2)}</Typography>
              </Box>
              <Button
                fullWidth
                variant="contained"
                onClick={handleCheckout}
                sx={{
                  bgcolor: '#67442E',
                  '&:hover': { bgcolor: '#523524' },
                  mb: 1,
                }}
              >
                Proceed to Checkout
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearCart}
                sx={{
                  color: '#67442E',
                  borderColor: '#67442E',
                  '&:hover': {
                    borderColor: '#523524',
                    bgcolor: 'rgba(103, 68, 46, 0.04)',
                  },
                }}
              >
                Clear Cart
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CartPage; 