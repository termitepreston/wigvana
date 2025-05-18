import { RouterProvider, createRouter } from "@tanstack/react-router";
import type React from "react";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import { CssBaseline } from "@mui/material";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./context/AuthContext";
import { ProductProvider } from "./context/ProductContext";
import { CartProvider } from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { MessagingProvider } from "./context/MessagingContext";
import { ToastProvider } from "./context/ToastContext";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const AppProviders: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<ToastContainer position="top-right" autoClose={3000} />
			<ToastProvider>
				<AuthProvider>
					<ProductProvider>
						<CartProvider>
							<FavoritesProvider>
								<MessagingProvider>{children}</MessagingProvider>
							</FavoritesProvider>
						</CartProvider>
					</ProductProvider>
				</AuthProvider>
			</ToastProvider>
		</ThemeProvider>
	);
};

// Render the app
const rootElement = document.getElementById("root");
if (rootElement) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<AppProviders>
				<RouterProvider router={router} />
			</AppProviders>
		</StrictMode>,
	);
}
