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
  Rating,
  IconButton,
} from '@mui/material';
import { Link } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';

const FavoritesPage = () => {
  const { favorites, removeFromFavorites } = useFavorites();
  const { user } = useAuth();

  if (!user) {
    return (
      <Container sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Please log in to view your favorites
          </Typography>
          <Button
            component={Link}
            to="/login"
            variant="contained"
            sx={{
              mt: 2,
              bgcolor: '#67442E',
              '&:hover': { bgcolor: '#523524' },
            }}
          >
            Log In
          </Button>
        </Box>
      </Container>
    );
  }

  if (favorites.length === 0) {
    return (
      <Container sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            No favorites yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Start adding products to your favorites while browsing
          </Typography>
          <Button
            component={Link}
            to="/products"
            variant="contained"
            sx={{
              bgcolor: '#67442E',
              '&:hover': { bgcolor: '#523524' },
            }}
          >
            Browse Products
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#67442E' }}>
        Your Favorites
      </Typography>
      <Grid container spacing={4}>
        {favorites.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={4}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
            >
              <IconButton
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 1)',
                  },
                }}
                onClick={() => removeFromFavorites(product.id)}
              >
                <FavoriteIcon sx={{ color: '#67442E' }} />
              </IconButton>
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
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating value={product.rating} readOnly precision={0.5} size="small" />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    ({product.reviewCount})
                  </Typography>
                </Box>
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
    </Container>
  );
};

export default FavoritesPage; 