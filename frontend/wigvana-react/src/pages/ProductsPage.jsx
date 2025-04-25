import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Chip,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import productsData from '../data/products.json';

// Create a ProductsContext to manage all products
const ProductsContext = React.createContext();

export const ProductsProvider = ({ children }) => {
  const [allProducts, setAllProducts] = useState([]);

  const addProduct = (product) => {
    setAllProducts(prev => [...prev, product]);
  };

  return (
    <ProductsContext.Provider value={{ allProducts, addProduct }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = React.useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};

const ProductsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState('all');

  // Parse query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search');
    const cat = params.get('category');
    if (search) setSearchQuery(search);
    if (cat) setCategory(cat);
  }, [location]);

  // Initialize with mock products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setProducts(productsData.products);
      } catch (error) {
        console.error('Error fetching products:', error);
        showToast('Failed to load products', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (category !== 'all') params.append('category', category);
    navigate({ search: params.toString() });
  };

  const handleFavoriteClick = (product) => {
    if (!user) {
      showToast('Please login to save favorites', 'warning');
      return;
    }

    if (isFavorite(product.id)) {
      removeFromFavorites(product.id);
      showToast('Removed from favorites', 'success');
    } else {
      addToFavorites(product);
      showToast('Added to favorites', 'success');
    }
  };

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    // Convert search query and product text to lowercase for case-insensitive comparison
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = !searchLower || 
      product.name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower) ||
      (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchLower)));
    
    // Match category exactly (case-insensitive)
    const matchesCategory = category === 'all' || 
      product.category.toLowerCase() === category.toLowerCase();
    
    const matchesPriceRange = priceRange === 'all' ||
      (priceRange === 'under5000' && product.price < 5000) ||
      (priceRange === '5000-10000' && product.price >= 5000 && product.price <= 10000) ||
      (priceRange === 'over10000' && product.price > 10000);

    return matchesSearch && matchesCategory && matchesPriceRange;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'priceLow':
        return a.price - b.price;
      case 'priceHigh':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#67442E' }} />
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      {/* Search and Filter Section */}
      <Box sx={{ mb: 4 }}>
        <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search wigs..."
            variant="outlined"
            sx={{
              bgcolor: 'white',
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#67442E',
                },
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="submit">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="Natural Wigs">Natural Wigs</MenuItem>
                <MenuItem value="Synthetic Wigs">Synthetic Wigs</MenuItem>
                <MenuItem value="Lace Front">Lace Front</MenuItem>
                <MenuItem value="Full Lace">Full Lace</MenuItem>
                <MenuItem value="Human Hair">Human Hair</MenuItem>
                <MenuItem value="Braided Wigs">Braided Wigs</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Price Range</InputLabel>
              <Select
                value={priceRange}
                label="Price Range"
                onChange={(e) => setPriceRange(e.target.value)}
              >
                <MenuItem value="all">All Prices</MenuItem>
                <MenuItem value="under5000">Under ETB 5,000</MenuItem>
                <MenuItem value="5000-10000">ETB 5,000 - 10,000</MenuItem>
                <MenuItem value="over10000">Over ETB 10,000</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="featured">Featured</MenuItem>
                <MenuItem value="priceLow">Price: Low to High</MenuItem>
                <MenuItem value="priceHigh">Price: High to Low</MenuItem>
                <MenuItem value="rating">Top Rated</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Results Count */}
      <Typography variant="h6" sx={{ mb: 3, color: '#67442E' }}>
        {sortedProducts.length} {sortedProducts.length === 1 ? 'result' : 'results'} found
      </Typography>

      {/* Products Grid */}
      <Grid container spacing={4}>
        {sortedProducts.map((product) => (
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
                onClick={() => handleFavoriteClick(product)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 1)',
                  },
                }}
              >
                <FavoriteIcon
                  sx={{
                    color: isFavorite(product.id) ? '#67442E' : 'rgba(0, 0, 0, 0.54)',
                  }}
                />
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

export default ProductsPage; 