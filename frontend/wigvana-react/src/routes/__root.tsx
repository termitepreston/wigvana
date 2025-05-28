import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
	component: () => (
		<>
			<div>
				<Link to="/">Home</Link>
				<Link to="/about">About</Link>
				<Link to="/contact">Contact</Link>
				<Link to="/faq">FAQ</Link>
				<Link to="/shipping">Shipping</Link>
				<Link to="/returns">Returns</Link>
				<Link to="/login">Login</Link>
				<Link to="/register">Register</Link>
			</div>
			<Outlet />
			<TanStackRouterDevtools />
		</>
	),
});
