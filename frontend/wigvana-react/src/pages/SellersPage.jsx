import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Box,
  Rating,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Link } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import StoreIcon from '@mui/icons-material/Store';
import { useToast } from '../context/ToastContext';
import sellersData from '../data/sellers.json';

const SellersPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Create a copy of sellers data and assign banner images
        const sellersWithImages = sellersData.sellers.map((seller, index) => {
          // Use ban1, ban2, ban3 images in rotation for seller cover images
          const bannerIndex = (index % 3) + 1;
          return {
            ...seller,
            coverImage: `/images/store%20image/ban${bannerIndex}.jpg`
          };
        });
        
        setSellers(sellersWithImages);
      } catch (error) {
        showToast('Failed to load sellers data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSellers();
  }, [showToast]);

  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = seller.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'all' || seller.categories.includes(category);
    return matchesSearch && matchesCategory;
  });

  // Sort sellers
  const sortedSellers = [...filteredSellers].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'products') return b.productCount - a.productCount;
    if (sortBy === 'reviews') return b.reviewCount - a.reviewCount;
    return 0;
  });

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
      <Typography variant="h4" sx={{ color: '#67442E', mb: 4 }}>
        Browse Wig Stores
      </Typography>

      {/* Search and Filter Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder="Search stores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="Natural">Natural</MenuItem>
              <MenuItem value="Synthetic">Synthetic</MenuItem>
              <MenuItem value="Custom">Custom</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="rating">Top Rated</MenuItem>
              <MenuItem value="products">Most Products</MenuItem>
              <MenuItem value="reviews">Most Reviews</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {sortedSellers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <StoreIcon sx={{ fontSize: 60, color: '#67442E', opacity: 0.6, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No sellers found matching your criteria
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {sortedSellers.map((seller) => (
            <Grid item xs={12} sm={6} md={4} key={seller.id}>
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
                  height="180"
                  image={seller.coverImage}
                  alt={seller.name}
                  sx={{ 
                    objectFit: 'cover',
                    objectPosition: 'center' 
                  }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {seller.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={seller.rating} readOnly precision={0.5} size="small" />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      ({seller.reviewCount})
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {seller.productCount} products
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {seller.description}
                  </Typography>
                  <Button
                    component={Link}
                    to={`/seller/${seller.id}`}
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
                    Visit Store
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default SellersPage; 