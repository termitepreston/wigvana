import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

type AuthProviderProps = {
	children: React.ReactNode;
};

interface User {
	id: number;
	email: string;
	name: string;
	isSeller: boolean;
	token: string;
	role?: string;
	isSellerProfileComplete?: boolean;
}

interface RegisterData {
	email: string;
	password: string;
	type: string;
	isSeller: boolean;
}

interface FormData {
	storeName: string;
	description: string;
}

interface AuthContextType {
	user: User | null;
	loading: boolean;
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<boolean>;
	register: (userData: RegisterData) => Promise<boolean>;
	logout: () => void;
	becomeSeller: (formData: FormData) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Check for stored user data on component mount
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			setUser(JSON.parse(storedUser) as User);
		}
		setLoading(false);
	}, []);

	const login = async (email: string, password: string) => {
		try {
			// TODO: Replace with actual API call
			// Simulated API response
			const response = {
				id: 1,
				email: "adonawit@gmail.com",
				name: "Adonawit",
				isSeller: email.includes("seller"),
				token: "dummy-token",
			};

			setUser(response);
			localStorage.setItem("user", JSON.stringify(response));
			toast.success("Successfully logged in!");
			return true;
		} catch (error) {
			toast.error("Login failed. Please check your credentials.");
			return false;
		}
	};

	const register = async (userData: RegisterData) => {
		try {
			if (!userData.email || !userData.password) {
				throw new Error("Email and password are required");
			}

			// Create base user object with unique token
			const response: User = {
				id: Date.now(),
				email: "adonawit@gmail.com",
				name: "Adonawit",
				isSeller: false,
				role: "buyer",
				token: `auth-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			};

			// If registering as a seller, mark as incomplete seller
			if (userData.type === "seller" || userData.isSeller) {
				response.isSeller = true;
				response.role = "seller";
				response.isSellerProfileComplete = false;
			} else {
				// Set welcomed flag only for buyers
				localStorage.setItem(`welcomed_${response.id}`, "false");
			}

			// Save user data
			setUser(response);
			localStorage.setItem("user", JSON.stringify(response));

			// Show appropriate success message
			if (response.isSeller) {
				toast.success("Please complete your seller profile to start selling");
			} else {
				toast.success("Successfully registered! Welcome to WigVana");
			}

			return true;
		} catch (error) {
			console.error("Registration error:", error);

			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error("Registration failed. Please try again.");
			}
			return false;
		}
	};

	const logout = () => {
		setUser(null);
		localStorage.removeItem("user");
		toast.success("Successfully logged out!");
	};

	const becomeSeller = async (formData: FormData) => {
		try {
			if (!user) {
				throw new Error("You must be logged in to become a seller");
			}

			const updatedUser = {
				...user,
				isSeller: true,
				storeId: Date.now(),
				role: "seller",
				storeName: formData.storeName,
				storeDescription: formData.description,
				isSellerProfileComplete: true,
			};

			// Remove any buyer-specific flags
			localStorage.removeItem(`welcomed_${user.id}`);

			setUser(updatedUser);
			localStorage.setItem("user", JSON.stringify(updatedUser));
			toast.success("Successfully registered as a seller!");
			return true;
		} catch (error) {
			console.error("Become seller error:", error);

			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error("Failed to register as a seller. Please try again.");
			}

			return false;
		}
	};

	const contextValue: AuthContextType = {
		user,
		loading,
		isAuthenticated: !!user,
		login,
		register,
		logout,
		becomeSeller,
	};

	return (
		<AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export default AuthContext;
