import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CardMedia,
  IconButton,
} from '@mui/material';
import { toast } from 'react-toastify';
import {
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  Message as MessageIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useToast } from '../context/ToastContext';
import { useProducts } from '../context/ProductContext';
import ImageUpload from '../components/ImageUpload';
import * as Yup from 'yup';
import { Formik, Form, Field } from 'formik';

// Validation schema
const ProductSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters')
    .required('Name is required'),
  price: Yup.number()
    .positive('Price must be positive')
    .required('Price is required'),
  category: Yup.string()
    .required('Category is required'),
  description: Yup.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .required('Description is required'),
  stock: Yup.number()
    .integer('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .required('Stock is required'),
});

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { addProduct, getSellerProducts, deleteProduct } = useProducts();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    unreadMessages: 0,
  });

  const products = getSellerProducts();

  useEffect(() => {
    if (!isAuthenticated || !user?.isSeller) {
      toast.error('You must be logged in as a seller to access this page');
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setStats({
          totalProducts: products.length,
          totalSales: 0,
          totalRevenue: 0,
          unreadMessages: 0,
        });
      } catch (error) {
        toast.error('Failed to load dashboard data');
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, user, navigate, products.length, showToast]);

  const handleAddProduct = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const newProduct = addProduct({
        ...values,
        image: values.image?.base64 || '/images/placeholder.jpg',
      });
      showToast('Product added successfully', 'success');
      resetForm();
      setDialogOpen(false);
      setStats(prev => ({
        ...prev,
        totalProducts: prev.totalProducts + 1
      }));
    } catch (error) {
      showToast('Failed to add product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(productId);
      showToast('Product deleted successfully', 'success');
      setStats(prev => ({
        ...prev,
        totalProducts: prev.totalProducts - 1
      }));
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Icon sx={{ fontSize: 40, color }} />
          </Grid>
          <Grid item xs>
            <Typography color="textSecondary" variant="h6" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">
              {title.includes('Revenue') ? `ETB ${value.toLocaleString()}` : value}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Seller Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddProduct}
          sx={{
            bgcolor: '#67442E',
            '&:hover': { bgcolor: '#523524' },
          }}
        >
          Add New Product
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={InventoryIcon}
            title="Total Products"
            value={stats.totalProducts}
            color="#67442E"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={CartIcon}
            title="Total Sales"
            value={stats.totalSales}
            color="#8B5E3C"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={MoneyIcon}
            title="Total Revenue"
            value={stats.totalRevenue}
            color="#A67B5B"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={MessageIcon}
            title="Unread Messages"
            value={stats.unreadMessages}
            color="#C1967A"
          />
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          sx={{
            '& .MuiTab-root': {
              color: '#67442E',
            },
            '& .Mui-selected': {
              color: '#67442E',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#67442E',
            },
          }}
        >
          <Tab label="Products" />
          <Tab label="Messages" />
        </Tabs>
      </Paper>

      {/* Add New Product Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add New Product</DialogTitle>
        <Formik
          initialValues={{
            name: '',
            price: '',
            category: '',
            description: '',
            stock: '',
            image: null,
          }}
          validationSchema={ProductSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Field
                      name="name"
                      as={TextField}
                      label="Product Name"
                      fullWidth
                      error={touched.name && !!errors.name}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      name="price"
                      as={TextField}
                      label="Price"
                      type="number"
                      fullWidth
                      error={touched.price && !!errors.price}
                      helperText={touched.price && errors.price}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      name="stock"
                      as={TextField}
                      label="Stock"
                      type="number"
                      fullWidth
                      error={touched.stock && !!errors.stock}
                      helperText={touched.stock && errors.stock}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth error={touched.category && !!errors.category}>
                      <InputLabel>Category</InputLabel>
                      <Field
                        name="category"
                        as={Select}
                        label="Category"
                      >
                        <MenuItem value="Natural Wigs">Natural Wigs</MenuItem>
                        <MenuItem value="Synthetic Wigs">Synthetic Wigs</MenuItem>
                        <MenuItem value="Lace Front">Lace Front</MenuItem>
                        <MenuItem value="Full Lace">Full Lace</MenuItem>
                        <MenuItem value="Human Hair">Human Hair</MenuItem>
                        <MenuItem value="Braided Wigs">Braided Wigs</MenuItem>
                      </Field>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      name="description"
                      as={TextField}
                      label="Description"
                      multiline
                      rows={4}
                      fullWidth
                      error={touched.description && !!errors.description}
                      helperText={touched.description && errors.description}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field name="image">
                      {({ field, form }) => (
                        <ImageUpload
                          value={field.value}
                          onChange={(imageData) => form.setFieldValue('image', imageData)}
                          error={errors.image}
                          touched={touched.image}
                        />
                      )}
                    </Field>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog}>Cancel</Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    bgcolor: '#67442E',
                    '&:hover': { bgcolor: '#523524' },
                  }}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Add Product'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      {currentTab === 0 && (
        <Box sx={{ mt: 2 }}>
          {products.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No products yet
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                Start adding products to your store
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddProduct}
                sx={{
                  bgcolor: '#67442E',
                  '&:hover': { bgcolor: '#523524' },
                }}
              >
                Add Your First Product
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {products.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                        ETB {product.price}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Category: {product.category}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Stock: {product.stock}
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <IconButton
                          size="small"
                          sx={{ color: '#67442E' }}
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {currentTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Messages</Typography>
          <Typography variant="body1" color="textSecondary">
            Message functionality coming soon...
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default SellerDashboard; 