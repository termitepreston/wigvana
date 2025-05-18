import { createFileRoute } from "@tanstack/react-router";

import { type FormEvent, use, useState } from "react";
import {
	Container,
	Paper,
	Typography,
	TextField,
	Button,
	Box,
	Alert,
	Link as MuiLink,
	CircularProgress,
} from "@mui/material";
import { Link, useNavigate } from "@tanstack/react-router";
import AuthContext, { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export const Route = createFileRoute("/login")({
	component: Login,
});

function Login() {
	const navigate = useNavigate();

	const authContext = use(AuthContext);

	if (!authContext) {
		throw new Error("Auth functions must be used within an AuthProvider.");
	}

	const { login } = authContext;

	const { showToast } = useToast();
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [errors, setErrors] = useState<{ email?: string; password?: string }>(
		{},
	);

	const validateForm = () => {
		const newErrors: {
			email?: string;
			password?: string;
		} = {};

		// Email validation
		if (!formData.email) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "Invalid email format";
		}

		// Password validation
		if (!formData.password) {
			newErrors.password = "Password is required";
		} else if (formData.password.length < 6) {
			newErrors.password = "Password must be at least 6 characters";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!validateForm()) {
			showToast("Please fix the form errors", "error");
			return;
		}

		setLoading(true);
		try {
			await login(formData.email, formData.password);
			showToast("Login successful!", "success");
			navigate({ to: "/" });
		} catch (err) {
			showToast(
				err instanceof Error ? err.message : "Invalid email or password",
				"error",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container maxWidth="sm" sx={{ py: 8 }}>
			<Paper elevation={3} sx={{ p: 4 }}>
				<Typography
					variant="h4"
					align="center"
					sx={{ color: "#67442E", mb: 4 }}
				>
					Login
				</Typography>

				<form onSubmit={handleSubmit}>
					<TextField
						fullWidth
						label="Email"
						type="email"
						margin="normal"
						required
						value={formData.email}
						onChange={(e) =>
							setFormData({ ...formData, email: e.target.value })
						}
						error={!!errors.email}
						helperText={errors.email}
						disabled={loading}
					/>
					<TextField
						fullWidth
						label="Password"
						type="password"
						margin="normal"
						required
						value={formData.password}
						onChange={(e) =>
							setFormData({ ...formData, password: e.target.value })
						}
						error={!!errors.password}
						helperText={errors.password}
						disabled={loading}
					/>
					<Button
						type="submit"
						fullWidth
						variant="contained"
						disabled={loading}
						sx={{
							mt: 3,
							mb: 2,
							bgcolor: "#67442E",
							"&:hover": {
								bgcolor: "#523524",
							},
						}}
					>
						{loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
					</Button>
				</form>

				<Box sx={{ textAlign: "center", mt: 2 }}>
					<Typography variant="body2">
						Don't have an account?{" "}
						<MuiLink component={Link} to="/register" sx={{ color: "#67442E" }}>
							Register here
						</MuiLink>
					</Typography>
				</Box>
			</Paper>
		</Container>
	);
}
