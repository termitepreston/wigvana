import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Formik, Form, Field } from 'formik';
import { TextField } from 'formik-mui';
import * as Yup from 'yup';
import productsData from '../data/products.json';
import ImageUpload from '../components/ImageUpload';

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
  availableLengths: Yup.array()
    .min(1, 'Select at least one length')
    .required('Available lengths are required'),
  availableColors: Yup.array()
    .min(1, 'Select at least one color')
    .required('Available colors are required'),
  image: Yup.mixed()
    .required('Image is required'),
});

const SellerProducts = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const sellerProducts = productsData.products.filter(
          product => product.sellerId === user.storeId
        );
        setProducts(sellerProducts);
      } catch (error) {
        showToast('Failed to load products', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user.storeId]);

  const handleAddNew = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = async (productId) => {
    try {
      const updatedProducts = products.filter(p => p.id !== productId);
      setProducts(updatedProducts);
      showToast('Product deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete product', 'error');
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const newProduct = {
        id: editingProduct ? editingProduct.id : Date.now(),
        ...values,
        sellerId: user.storeId,
        sellerName: user.storeName || user.name,
        rating: editingProduct ? editingProduct.rating : 0,
        reviewCount: editingProduct ? editingProduct.reviewCount : 0,
      };

      let updatedProducts;
      if (editingProduct) {
        updatedProducts = products.map(p => 
          p.id === editingProduct.id ? newProduct : p
        );
        showToast('Product updated successfully', 'success');
      } else {
        updatedProducts = [...products, newProduct];
        showToast('Product added successfully', 'success');
      }

      setProducts(updatedProducts);
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      showToast('Failed to save product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">My Products</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddNew}
          sx={{ bgcolor: '#67442E', '&:hover': { bgcolor: '#523524' } }}
        >
          Add New Product
        </Button>
      </Box>

      {products.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No products yet
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Start adding products to your store
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            sx={{ bgcolor: '#67442E', '&:hover': { bgcolor: '#523524' } }}
          >
            Add Your First Product
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      style={{ width: 50, height: 50, objectFit: 'cover' }}
                    />
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell align="right">ETB {product.price.toLocaleString()}</TableCell>
                  <TableCell align="right">{product.stock}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(product)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(product.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <Formik
          initialValues={editingProduct || {
            name: '',
            price: '',
            category: '',
            description: '',
            stock: '',
            image: null,
            availableLengths: [],
            availableColors: [],
          }}
          validationSchema={ProductSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, setFieldValue, values, errors, touched }) => (
            <Form>
              <DialogContent>
                <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
                  <Field
                    component={TextField}
                    name="name"
                    label="Product Name"
                    fullWidth
                  />
                  <Field
                    component={TextField}
                    name="price"
                    label="Price"
                    type="number"
                    fullWidth
                  />
                  <FormControl fullWidth error={touched.category && !!errors.category}>
                    <InputLabel>Category</InputLabel>
                    <Field
                      component={Select}
                      name="category"
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
                  <Field
                    component={TextField}
                    name="description"
                    label="Description"
                    multiline
                    rows={4}
                    fullWidth
                  />
                  <Field
                    component={TextField}
                    name="stock"
                    label="Stock"
                    type="number"
                    fullWidth
                  />
                  <Field name="image">
                    {({ field, form }) => (
                      <ImageUpload
                        value={field.value?.base64 || field.value}
                        onChange={({ base64, error }) => {
                          form.setFieldValue('image', base64 ? { base64 } : null);
                          form.setFieldError('image', error);
                        }}
                        error={form.errors.image}
                        touched={form.touched.image}
                      />
                    )}
                  </Field>
                  <FormControl fullWidth error={touched.availableLengths && !!errors.availableLengths}>
                    <InputLabel>Available Lengths</InputLabel>
                    <Field
                      component={Select}
                      name="availableLengths"
                      label="Available Lengths"
                      multiple
                    >
                      {['16', '18', '20', '22', '24', '26'].map((length) => (
                        <MenuItem key={length} value={length}>
                          {length} inches
                        </MenuItem>
                      ))}
                    </Field>
                  </FormControl>
                  <FormControl fullWidth error={touched.availableColors && !!errors.availableColors}>
                    <InputLabel>Available Colors</InputLabel>
                    <Field
                      component={Select}
                      name="availableColors"
                      label="Available Colors"
                      multiple
                    >
                      {['Natural Black', 'Dark Brown', 'Brown', 'Blonde'].map((color) => (
                        <MenuItem key={color} value={color}>
                          {color}
                        </MenuItem>
                      ))}
                    </Field>
                  </FormControl>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button 
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{ bgcolor: '#67442E', '&:hover': { bgcolor: '#523524' } }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} />
                  ) : (
                    editingProduct ? 'Save Changes' : 'Add Product'
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Box>
  );
};

export default SellerProducts; 