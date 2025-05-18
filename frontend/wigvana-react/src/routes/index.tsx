import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import SearchIcon from "@mui/icons-material/Search";
import {
	Box,
	Button,
	Card,
	CardContent,
	CardMedia,
	Container,
	Fade,
	Grid,
	IconButton,
	InputAdornment,
	Paper,
	Rating,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export const Route = createFileRoute("/")({
	component: Index,
});

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
}

type Products = Product[];

type ApiProducts = {
	products: Products;
};

function Index() {
	const { user } = useAuth();
	const [featuredProducts, setFeaturedProducts] = useState<Products>([]);
	const [loading, setLoading] = useState(true);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const theme = useTheme();
	const navigate = useNavigate();
	const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const categories = [
		{ title: "Natural Wigs", image: "/images/img1.jpg", slug: "natural-wigs" },
		{
			title: "Synthetic Wigs",
			image: "/images/img6.jpg",
			slug: "synthetic-wigs",
		},
		{ title: "Lace Front", image: "/images/img3.jpg", slug: "lace-front" },
		{ title: "Full Lace", image: "/images/img5.jpg", slug: "full-lace" },
		{ title: "Human Hair", image: "/images/img7.jpg", slug: "human-hair" },
		{ title: "Braided Wigs", image: "/images/img9.jpg", slug: "braided-wigs" },
	].map((category, index) => ({ ...category, id: index }));

	const heroImages = [
		{
			image: "/images/img2.jpg",
			title: "Find Your Perfect Style",
			subtitle: "Quality wigs from verified Ethiopian sellers",
		},
		{
			image: "/images/img4.jpg",
			title: "Premium Lace Front Wigs",
			subtitle: "Natural hairline & comfortable fit",
		},
		{
			image: "/images/img5.jpg",
			title: "Human Hair Collection",
			subtitle: "Top quality wigs that last longer",
		},
		{
			image: "/images/img7.jpg",
			title: "New Arrivals",
			subtitle: "Discover our latest styles",
		},
	];

	useEffect(() => {
		const fetchProducts = async () => {
			try {
				const response = await fetch("/src/data/products.json");
				const data = (await response.json()) as ApiProducts;
				setFeaturedProducts(data.products.filter((p) => p.isFeatured));
			} catch (error) {
				console.error("Error fetching products:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchProducts();
	}, []);

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentImageIndex((prevIndex) =>
				prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1,
			);
		}, 5000); // Change image every 5 seconds

		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		// Check if this is user's first visit after registration
		if (
			user &&
			!localStorage.getItem(`welcomed_${user.id}`) &&
			!user.isSeller
		) {
			setIsFirstTimeUser(true);
			// Set the flag in localStorage so we don't show first-time message again
			localStorage.setItem(`welcomed_${user.id}`, "true");
		}
	}, [user]);

	const handleNextImage = () => {
		setCurrentImageIndex((prevIndex) =>
			prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1,
		);
	};

	const handlePrevImage = () => {
		setCurrentImageIndex((prevIndex) =>
			prevIndex === 0 ? heroImages.length - 1 : prevIndex - 1,
		);
	};

	const getWelcomeMessage = () => {
		if (!user) {
			return {
				title: "Find Your Perfect Style",
				subtitle: "Quality wigs from verified Ethiopian sellers",
			};
		}
		if (user.isSeller || user.role === "seller") {
			return {
				title: "Welcome to Your Seller Dashboard",
				subtitle: "Manage your store and start selling today",
			};
		}
		if (isFirstTimeUser) {
			return {
				title: "Welcome to WigVana!",
				subtitle: "Get 30% off your first purchase with code: WELCOME30",
			};
		}
		return {
			title: "Welcome Back!",
			subtitle: "Discover new styles just for you",
		};
	};

	const getActionButtons = () => {
		if (!user) {
			return (
				<Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "center" }}>
					<Button
						component={Link}
						to="/register"
						variant="contained"
						sx={{
							bgcolor: "white",
							color: "#67442E",
							"&:hover": { bgcolor: "#F5E6E0" },
						}}
					>
						Join WigVana
					</Button>
					<Button
						component={Link}
						to="/login"
						variant="outlined"
						sx={{
							color: "white",
							borderColor: "white",
							"&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
						}}
					>
						Sign In
					</Button>
				</Box>
			);
		}
		if (user.isSeller || user.role === "seller") {
			return (
				<Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "center" }}>
					<Button
						component={Link}
						to="/seller/dashboard"
						variant="contained"
						sx={{
							bgcolor: "white",
							color: "#67442E",
							"&:hover": { bgcolor: "#F5E6E0" },
						}}
					>
						Go to Dashboard
					</Button>
				</Box>
			);
		}
		if (isFirstTimeUser) {
			return (
				<Box
					sx={{
						mt: 4,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 2,
					}}
				>
					<Button
						component={Link}
						to="/explore"
						variant="contained"
						sx={{
							bgcolor: "white",
							color: "#67442E",
							"&:hover": { bgcolor: "#F5E6E0" },
							px: 4,
							py: 1.5,
							fontSize: "1.1rem",
						}}
					>
						Start Shopping with 30% Off
					</Button>
					<Typography
						variant="body2"
						sx={{ color: "white", textAlign: "center" }}
					>
						Use code WELCOME30 at checkout
					</Typography>
				</Box>
			);
		}
		return (
			<Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "center" }}>
				<Button
					component={Link}
					to="/explore"
					variant="contained"
					sx={{
						bgcolor: "white",
						color: "#67442E",
						"&:hover": { bgcolor: "#F5E6E0" },
					}}
				>
					Explore Wigs
				</Button>
			</Box>
		);
	};

	const handleCategoryClick = (category: { title: string }) => {
		navigate({
			to: `/products?category=${encodeURIComponent(category.title)}`,
		});
	};

	const handleSearch = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			navigate({
				to: `/products?search=${encodeURIComponent(searchQuery.trim())}`,
			});
		}
	};

	return (
		<Box>
			{/* Animated Hero Banner */}
			<Box
				sx={{
					position: "relative",
					height: "80vh",
					overflow: "hidden",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					"&::before": {
						content: '""',
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						bgcolor: "rgba(0, 0, 0, 0.5)",
						zIndex: 1,
					},
				}}
			>
				{/* Hero Image */}
				<Box
					component="img"
					src={heroImages[currentImageIndex].image}
					alt="Hero"
					sx={{
						position: "absolute",
						width: "100%",
						height: "100%",
						objectFit: "cover",
						transition: "opacity 0.5s ease-in-out",
					}}
				/>

				{/* Content Overlay */}
				<Container
					sx={{
						position: "relative",
						zIndex: 2,
						color: "white",
						textAlign: "center",
					}}
				>
					<Fade in={true} timeout={1000}>
						<Box>
							<Typography
								variant="h2"
								sx={{
									fontWeight: "bold",
									mb: 2,
									textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
								}}
							>
								{getWelcomeMessage().title}
							</Typography>
							<Typography
								variant="h5"
								sx={{
									mb: 4,
									textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
								}}
							>
								{getWelcomeMessage().subtitle}
							</Typography>

							{/* Search Bar */}
							<Box
								component="form"
								onSubmit={handleSearch}
								sx={{
									display: "flex",
									justifyContent: "center",
									mb: 4,
								}}
							>
								<TextField
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search for wigs..."
									variant="outlined"
									sx={{
										width: "100%",
										maxWidth: 600,
										bgcolor: "white",
										borderRadius: 1,
										"& .MuiOutlinedInput-root": {
											"& fieldset": {
												borderColor: "transparent",
											},
											"&:hover fieldset": {
												borderColor: "transparent",
											},
											"&.Mui-focused fieldset": {
												borderColor: "#67442E",
											},
										},
									}}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												<IconButton type="submit" sx={{ color: "#67442E" }}>
													<SearchIcon />
												</IconButton>
											</InputAdornment>
										),
									}}
								/>
							</Box>

							{getActionButtons()}
						</Box>
					</Fade>
				</Container>

				{/* Navigation Arrows */}
				<IconButton
					onClick={handlePrevImage}
					sx={{
						position: "absolute",
						left: 20,
						zIndex: 2,
						color: "white",
						"&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
					}}
				>
					<NavigateBeforeIcon sx={{ fontSize: 40 }} />
				</IconButton>
				<IconButton
					onClick={handleNextImage}
					sx={{
						position: "absolute",
						right: 20,
						zIndex: 2,
						color: "white",
						"&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
					}}
				>
					<NavigateNextIcon sx={{ fontSize: 40 }} />
				</IconButton>
			</Box>

			<Container maxWidth="lg">
				{/* Popular Categories */}
				<Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
					Shop our most popular categories
				</Typography>
				<Grid container spacing={3} sx={{ mb: 6 }}>
					{categories.map((category) => (
						<Grid size={{ xs: 6, sm: 4, md: 2 }} key={category.id}>
							<Paper
								onClick={() => handleCategoryClick(category)}
								sx={{
									cursor: "pointer",
									transition: "0.3s",
									"&:hover": {
										transform: "translateY(-5px)",
										boxShadow: 3,
									},
								}}
							>
								<Box
									component="img"
									src={category.image}
									alt={category.title}
									sx={{
										width: "100%",
										height: 150,
										objectFit: "cover",
										borderRadius: "8px 8px 0 0",
									}}
								/>
								<Typography
									sx={{
										p: 1,
										textAlign: "center",
										color: "text.primary",
									}}
								>
									{category.title}
								</Typography>
							</Paper>
						</Grid>
					))}
				</Grid>

				{/* Featured Products */}
				<Box sx={{ mb: 6 }}>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: 3,
						}}
					>
						<Typography variant="h5" sx={{ fontWeight: "bold" }}>
							Featured Products
						</Typography>
						<Button component={Link} to="/products" color="primary">
							View All
						</Button>
					</Box>
					<Grid container spacing={3}>
						{featuredProducts.slice(0, 4).map((product) => (
							<Grid size={{ xs: 12, sm: 6, md: 3 }} key={product.id}>
								<Card
									sx={{
										height: "100%",
										display: "flex",
										flexDirection: "column",
										transition: "0.3s",
										"&:hover": {
											transform: "translateY(-5px)",
										},
									}}
								>
									<CardMedia
										component="img"
										height="200"
										image={product.image}
										alt={product.name}
									/>
									<CardContent sx={{ flexGrow: 1 }}>
										<Typography gutterBottom variant="h6" component="div">
											{product.name}
										</Typography>
										<Typography
											variant="body2"
											color="text.secondary"
											gutterBottom
										>
											{product.sellerName}
										</Typography>
										<Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
											<Rating value={product.rating} readOnly size="small" />
											<Typography variant="body2" sx={{ ml: 1 }}>
												({product.reviewCount})
											</Typography>
										</Box>
										<Typography variant="h6" color="primary">
											ETB {product.price.toLocaleString()}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
						))}
					</Grid>
				</Box>

				{/* Seller Banner */}
				{(!user || user.role !== "seller") && (
					<Container sx={{ py: 6 }}>
						<Paper
							sx={{
								p: 4,
								bgcolor: "#67442E",
								color: "white",
								textAlign: "center",
							}}
						>
							<Typography variant="h5" sx={{ mb: 2 }}>
								Start Selling on WigVana
							</Typography>
							<Typography sx={{ mb: 3 }}>
								Join our marketplace and reach thousands of customers
							</Typography>
							<Button
								component={Link}
								to={user ? "/become-seller" : "/register?type=seller"}
								variant="contained"
								sx={{
									bgcolor: "white",
									color: "#67442E",
									"&:hover": { bgcolor: "#F5E6E0" },
								}}
							>
								{user ? "Become a Seller" : "Register as Seller"}
							</Button>
						</Paper>
					</Container>
				)}
			</Container>
		</Box>
	);
}
