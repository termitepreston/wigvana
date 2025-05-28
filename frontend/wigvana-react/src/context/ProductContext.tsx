import type React from "react";
import { createContext, useContext, useState, useEffect, use } from "react";
import AuthContext from "./AuthContext";

type ProductProviderProps = {
	children: React.ReactNode;
};

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

type Products = Product[];

type ApiProducts = {
	products: Products;
};

interface ProductContextType {
	products: Products;
	addProduct: (product: Product) => Product;
	updateProduct: (productId: number, product: Partial<Product>) => void;
	deleteProduct: (productId: number) => void;
	getSellerProducts: () => Products;
}

const ProductContext = createContext<ProductContextType | null>(null);

export const useProducts = () => {
	const context = useContext(ProductContext);
	if (!context) {
		throw new Error("useProducts must be used within a ProductProvider");
	}
	return context;
};

export const ProductProvider: React.FC<ProductProviderProps> = ({
	children,
}) => {
	const authContext = use(AuthContext);

	if (!authContext) {
		throw new Error("No AuthContextProvider found.");
	}

	const { user } = authContext;

	const [products, setProducts] = useState<Products>([]);

	// Load products from localStorage when component mounts
	useEffect(() => {
		if (user?.isSeller) {
			const savedProducts = localStorage.getItem(`seller_products_${user.id}`);
			if (savedProducts) {
				setProducts(JSON.parse(savedProducts));
			}
		}
	}, [user]);

	// Save products to localStorage whenever they change
	useEffect(() => {
		if (user?.isSeller) {
			localStorage.setItem(
				`seller_products_${user.id}`,
				JSON.stringify(products),
			);
		}
	}, [products, user]);

	const addProduct = (product: Product) => {
		const newProduct = {
			...product,
			id: Date.now(),
			sellerId: user?.id || 0,
			createdAt: new Date().toISOString(),
		};
		setProducts((prevProducts) => [...prevProducts, newProduct]);
		return newProduct;
	};

	const updateProduct = (productId: number, updatedData: Partial<Product>) => {
		setProducts((prevProducts) =>
			prevProducts.map((product) =>
				product.id === productId ? { ...product, ...updatedData } : product,
			),
		);
	};

	const deleteProduct = (productId: number) => {
		setProducts((prevProducts) =>
			prevProducts.filter((product) => product.id !== productId),
		);
	};

	const getSellerProducts = () => {
		return products.filter((product) => product.sellerId === user?.id);
	};

	return (
		<ProductContext.Provider
			value={{
				products,
				addProduct,
				updateProduct,
				deleteProduct,
				getSellerProducts,
			}}
		>
			{children}
		</ProductContext.Provider>
	);
};

export default ProductContext;
