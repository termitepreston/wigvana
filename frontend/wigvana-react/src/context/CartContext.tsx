import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

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

type Cart = (Product & {
	selectedLength: string;
	selectedColor: string;
	quantity: number;
	productId: number;
})[];

type Products = Product[];

type ApiProducts = {
	products: Products;
};

type CartProviderProps = {
	children: React.ReactNode;
};

interface CartContextType {
	addToCart: (
		product: Product,
		selectedLength: string,
		selectedColor: string,
		quantity: number,
	) => boolean;
	updateQuantity: (
		productId: number,
		selectedLength: string,
		selectedColor: string,
		newQuantity: number,
	) => void;
	removeFromCart: (
		productId: number,
		selectedLength: string,
		selectedColor: string,
	) => void;
	clearCart: () => void;
	getCartTotal: () => number;
	getCartItemsCount: () => number;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
	const context = useContext(CartContext);
	if (!context) {
		throw new Error("useCart must be used within a CartProvider");
	}
	return context;
};

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
	const { user } = useAuth();
	const { showToast } = useToast();
	const [cartItems, setCartItems] = useState<Cart>([]);

	// Load cart from localStorage when user changes
	useEffect(() => {
		if (user) {
			const savedCart = localStorage.getItem(`cart_${user.id}`);
			if (savedCart) {
				setCartItems(JSON.parse(savedCart));
			}
		} else {
			setCartItems([]);
		}
	}, [user]);

	// Save cart to localStorage whenever it changes
	useEffect(() => {
		if (user) {
			localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartItems));
		}
	}, [cartItems, user]);

	const addToCart = (
		product: Product,
		selectedLength: string,
		selectedColor: string,
		quantity = 1,
	) => {
		if (!user) {
			showToast("Please login to add items to cart", "warning");
			return false;
		}

		setCartItems((prevItems) => {
			const existingItem = prevItems.find(
				(item) =>
					item.productId === product.id &&
					item.selectedLength === selectedLength &&
					item.selectedColor === selectedColor,
			);

			if (existingItem) {
				return prevItems.map((item) =>
					item === existingItem
						? { ...item, quantity: item.quantity + quantity }
						: item,
				);
			}

			return [
				...prevItems,
				{
					productId: product.id,
					name: product.name,
					price: product.price,
					image: product.image,
					selectedLength,
					selectedColor,
					quantity,
					sellerId: product.sellerId,
				},
			];
		});

		showToast("Added to cart successfully", "success");
		return true;
	};

	const updateQuantity = (
		productId,
		selectedLength,
		selectedColor,
		newQuantity,
	) => {
		if (newQuantity < 1) return;

		setCartItems((prevItems) =>
			prevItems.map((item) =>
				item.productId === productId &&
				item.selectedLength === selectedLength &&
				item.selectedColor === selectedColor
					? { ...item, quantity: newQuantity }
					: item,
			),
		);
	};

	const removeFromCart = (productId, selectedLength, selectedColor) => {
		setCartItems((prevItems) =>
			prevItems.filter(
				(item) =>
					!(
						item.productId === productId &&
						item.selectedLength === selectedLength &&
						item.selectedColor === selectedColor
					),
			),
		);
		showToast("Removed from cart", "success");
	};

	const clearCart = () => {
		setCartItems([]);
		showToast("Cart cleared", "success");
	};

	const getCartTotal = () => {
		return cartItems.reduce((total, item) => {
			const itemTotal = item.price * item.quantity;
			// Add length-based price adjustment
			const lengthPrice =
				parseInt(item.selectedLength) > 20
					? (parseInt(item.selectedLength) - 20) * 500
					: 0;
			return total + (itemTotal + lengthPrice * item.quantity);
		}, 0);
	};

	const getCartItemsCount = () => {
		return cartItems.reduce((total, item) => total + item.quantity, 0);
	};

	return (
		<CartContext.Provider
			value={{
				cartItems,
				addToCart,
				updateQuantity,
				removeFromCart,
				clearCart,
				getCartTotal,
				getCartItemsCount,
			}}
		>
			{children}
		</CartContext.Provider>
	);
};

export default CartContext;
