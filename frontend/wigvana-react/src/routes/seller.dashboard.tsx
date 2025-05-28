import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { useForm } from "@tanstack/react-form";
import { useState, useEffect, use } from "react";
import AuthContext from "../context/AuthContext";
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
} from "@mui/material";
import { toast } from "react-toastify";
import {
	Inventory as InventoryIcon,
	AttachMoney as MoneyIcon,
	ShoppingCart as CartIcon,
	Message as MessageIcon,
	Add as AddIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	type SvgIconComponent,
} from "@mui/icons-material";
import { useToast } from "../context/ToastContext";
import { useProducts } from "../context/ProductContext";
import ImageUpload from "../components/ImageUpload";

import { z } from "zod";

interface Product {
	id: number;
	name: string;
	price: number;
	description: string;
	image: string;
	category: string;
	sellerId: number;
	sellerName: string;
	rating: number;
	reviewCount: number;
	stocks: number;
	availableLengths: string[];
	availableColors: string[];
	features: string[];
	isFeatured?: boolean;
	stock?: number;
}

export const Route = createFileRoute("/seller/dashboard")({
	component: SellerDashboard,
});

const productSchema = z.object({
	name: z
		.string()
		.min(3, "Name must have at least 3 characters.")
		.max(100, "Name must be at least 100 characters."),
	price: z.number().positive("Price must be positive"),
	category: z.string(),
	description: z
		.string()
		.min(10, "Description must be at least 10 characters.")
		.max(500, "Description should be no more than 500 characters."),
	stock: z.number().int().min(0, "Stock cannot be negative."),
	image: z.string(),
});

type ProductSchemaType = z.infer<typeof productSchema>;

function SellerDashboard() {
	const authContext = use(AuthContext);

	if (!authContext) {
		throw new Error("No AuthProvider found.");
	}

	const { user, isAuthenticated } = authContext;

	const navigate = useNavigate();

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

	const form = useForm({
		defaultValues: {
			name: "",
			price: 1,
			category: "",
			description: "",
			stock: 1,
			image: "",
		},
		validators: {
			onChange: productSchema,
		},
		onSubmit: handleSubmit,
	});

	const products = getSellerProducts();

	useEffect(() => {
		if (!isAuthenticated || !user?.isSeller) {
			toast.error("You must be logged in as a seller to access this page");
			navigate({ to: "/login" });
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
				toast.error("Failed to load dashboard data");
				console.error("Error fetching dashboard data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, [isAuthenticated, user, navigate, products.length]);

	const handleAddProduct = () => {
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
	};

	async function handleSubmit({ value }: { value: Product }) {
		try {
			const newProduct = addProduct({
				...value,
				image: value.image?.base64 || "/images/placeholder.jpg",
			});
			showToast("Product added successfully", "success");
			form.reset();
			setDialogOpen(false);
			setStats((prev) => ({
				...prev,
				totalProducts: prev.totalProducts + 1,
			}));
		} catch (error) {
			showToast("Failed to add product", "error");
		}
	}

	const handleDeleteProduct = (productId: number) => {
		if (window.confirm("Are you sure you want to delete this product?")) {
			deleteProduct(productId);
			showToast("Product deleted successfully", "success");
			setStats((prev) => ({
				...prev,
				totalProducts: prev.totalProducts - 1,
			}));
		}
	};

	const StatCard = ({
		icon: Icon,
		title,
		value,
		color,
	}: {
		icon: SvgIconComponent;
		title: string;
		color: string;
		value: number;
	}) => (
		<Card sx={{ height: "100%" }}>
			<CardContent>
				<Grid container spacing={2} alignItems="center">
					<Grid>
						<Icon sx={{ fontSize: 40, color }} />
					</Grid>
					<Grid>
						<Typography color="textSecondary" variant="h6" gutterBottom>
							{title}
						</Typography>
						<Typography variant="h4">
							{title.includes("Revenue")
								? `ETB ${value.toLocaleString()}`
								: value}
						</Typography>
					</Grid>
				</Grid>
			</CardContent>
		</Card>
	);

	if (loading) {
		return (
			<Box
				display="flex"
				justifyContent="center"
				alignItems="center"
				minHeight="80vh"
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 4,
				}}
			>
				<Typography variant="h4">Seller Dashboard</Typography>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					onClick={handleAddProduct}
					sx={{
						bgcolor: "#67442E",
						"&:hover": { bgcolor: "#523524" },
					}}
				>
					Add New Product
				</Button>
			</Box>

			<Grid container spacing={3} sx={{ mb: 4 }}>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard
						icon={InventoryIcon}
						title="Total Products"
						value={stats.totalProducts}
						color="#67442E"
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard
						icon={CartIcon}
						title="Total Sales"
						value={stats.totalSales}
						color="#8B5E3C"
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard
						icon={MoneyIcon}
						title="Total Revenue"
						value={stats.totalRevenue}
						color="#A67B5B"
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard
						icon={MessageIcon}
						title="Unread Messages"
						value={stats.unreadMessages}
						color="#C1967A"
					/>
				</Grid>
			</Grid>

			<Paper sx={{ width: "100%", mb: 2 }}>
				<Tabs
					value={currentTab}
					onChange={(e, newValue) => setCurrentTab(newValue)}
					indicatorColor="primary"
					textColor="primary"
					sx={{
						"& .MuiTab-root": {
							color: "#67442E",
						},
						"& .Mui-selected": {
							color: "#67442E",
						},
						"& .MuiTabs-indicator": {
							backgroundColor: "#67442E",
						},
					}}
				>
					<Tab label="Products" />
					<Tab label="Messages" />
				</Tabs>
			</Paper>

			{/* Add New Product Dialog */}
			<Dialog
				open={dialogOpen}
				onClose={handleCloseDialog}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle>Add New Product</DialogTitle>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<DialogContent>
						<Grid container spacing={2}>
							<Grid size={{ xs: 12 }}>
								{/* Name input. */}
								<form.Field name="name">
									{(field) => (
										<TextField
											id={field.name}
											name={field.name}
											value={field.state.value}
											fullWidth
											label="Name"
											error={!!field.state.meta.errors}
											helperText={
												field.state.meta.errors
													? field.state.meta.errors.join(", ")
													: null
											}
										/>
									)}
								</form.Field>
							</Grid>

							{/* Price input. */}
							<Grid size={{ xs: 12, sm: 6 }}>
								<form.Field name="price">
									{(field) => (
										<TextField
											type="number"
											label="Price"
											fullWidth
											error={!!field.state.meta.errors}
											helperText={
												field.state.meta.errors
													? field.state.meta.errors.join(", ")
													: null
											}
										/>
									)}
								</form.Field>
							</Grid>

							{/* Stock input. */}
							<Grid size={{ xs: 12, sm: 6 }}>
								<form.Field name="stock">
									{(field) => (
										<TextField
											label="Stock"
											fullWidth
											error={!!field.state.meta.errors}
											helperText={
												field.state.meta.errors
													? field.state.meta.errors.join(", ")
													: null
											}
										/>
									)}
								</form.Field>
							</Grid>

							{/* Category input. */}
							<Grid size={{ xs: 12 }}>
								<form.Field name="category">
									{(field) => (
										<FormControl error={!!field.state.meta.errors} fullWidth>
											<InputLabel>Category</InputLabel>
											<Select label="Category">
												<MenuItem value="Natural Wigs">Natural Wigs</MenuItem>
												<MenuItem value="Synthetic Wigs">
													Synthetic Wigs
												</MenuItem>
												<MenuItem value="Lace Front">Lace Front</MenuItem>
												<MenuItem value="Full Lace">Full Lace</MenuItem>
												<MenuItem value="Human Hair">Human Hair</MenuItem>
												<MenuItem value="Braided Wigs">Braided Wigs</MenuItem>
											</Select>
										</FormControl>
									)}
								</form.Field>
							</Grid>

							{/* Description input. */}
							<Grid size={{ xs: 12 }}>
								<form.Field name="description">
									{(field) => (
										<TextField
											label="Description"
											error={!!field.state.meta.errors}
											fullWidth
											helperText={
												field.state.meta.errors
													? field.state.meta.errors.join(", ")
													: null
											}
										/>
									)}
								</form.Field>
							</Grid>

							{/* Image input. */}
							<Grid size={{ xs: 12 }}>
								<form.Field name="image">
									{(field) => (
										<ImageUpload
											onChange={(imageData) =>
												form.setFieldValue("image", imageData.preview ?? "")
											}
											error={field.state.meta.errors.join(", ")}
											touched={field.state.meta.isTouched}
											value={field.state.value}
										/>
									)}
								</form.Field>
							</Grid>
						</Grid>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCloseDialog}>Cancel</Button>
						<Button
							type="submit"
							variant="contained"
							disabled={form.state.isSubmitting}
							sx={{
								bgcolor: "#67442E",
								"&:hover": { bgcolor: "#523524" },
							}}
						>
							{form.state.isSubmitting ? (
								<CircularProgress size={24} />
							) : (
								"Add Product"
							)}
						</Button>
					</DialogActions>
				</form>
			</Dialog>

			{currentTab === 0 && (
				<Box sx={{ mt: 2 }}>
					{products.length === 0 ? (
						<Box sx={{ textAlign: "center", py: 4 }}>
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
									bgcolor: "#67442E",
									"&:hover": { bgcolor: "#523524" },
								}}
							>
								Add Your First Product
							</Button>
						</Box>
					) : (
						<Grid container spacing={3}>
							{products.map((product) => (
								<Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id}>
									<Card
										sx={{
											height: "100%",
											display: "flex",
											flexDirection: "column",
										}}
									>
										<CardMedia
											component="img"
											height="200"
											image={product.image}
											alt={product.name}
											sx={{ objectFit: "cover" }}
										/>
										<CardContent sx={{ flexGrow: 1 }}>
											<Typography variant="h6" gutterBottom>
												{product.name}
											</Typography>
											<Typography
												variant="body1"
												color="text.primary"
												sx={{ fontWeight: "bold", mb: 1 }}
											>
												ETB {product.price}
											</Typography>
											<Typography
												variant="body2"
												color="text.secondary"
												gutterBottom
											>
												Category: {product.category}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Stock: {product.stock}
											</Typography>
											<Box
												sx={{
													mt: 2,
													display: "flex",
													justifyContent: "flex-end",
													gap: 1,
												}}
											>
												<IconButton
													size="small"
													sx={{ color: "#67442E" }}
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
}
