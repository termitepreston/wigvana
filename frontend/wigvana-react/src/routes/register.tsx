import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";

import { type FormEvent, use, useState } from "react";
import {
	Container,
	Paper,
	Typography,
	TextField,
	Button,
	Box,
	FormControl,
	FormLabel,
	RadioGroup,
	FormControlLabel,
	Radio,
	Link as MuiLink,
	CircularProgress,
} from "@mui/material";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import AuthContext from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

import { z } from "zod";

const registerTypeSchema = z.object({
	role: z.enum(["seller", "buyer"]).default("buyer"),
});

export const Route = createFileRoute("/register")({
	component: Register,
	validateSearch: zodValidator(registerTypeSchema),
});

type RegisterType = z.infer<typeof registerTypeSchema>;

function Register() {
	const navigate = useNavigate();
	const location = useLocation();

	const authContext = use(AuthContext);

	if (!authContext) {
		throw Error("register function needs to be inside an AuthProvider.");
	}

	const { register } = authContext;

	const { showToast } = useToast();
	const [loading, setLoading] = useState(false);

	const { role } = Route.useSearch();

	const [formData, setFormData] = useState<
		RegisterType & {
			email: string;
			password: string;
			confirmPassword: string;
		}
	>({
		email: "",
		password: "",
		confirmPassword: "",
		role: role,
	});
	const [errors, setErrors] = useState<{
		email?: string;
		password?: string;
		confirmPassword?: string;
		role?: string;
	}>({});

	const validateForm = () => {
		const newErrors: {
			email?: string;
			password?: string;
			confirmPassword?: string;
			role?: string;
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

		// Confirm password validation
		if (!formData.confirmPassword) {
			newErrors.confirmPassword = "Please confirm your password";
		} else if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
		}

		// Role validation
		if (!formData.role) {
			newErrors.role = "Please select a role";
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
			const success = await register({
				email: formData.email,
				password: formData.password,
				type: formData.role,
				isSeller: formData.role === "seller",
			});

			if (success) {
				if (formData.role === "seller") {
					navigate({ to: "/become-seller", replace: true });
				} else {
					navigate({ to: "/", replace: true });
				}
			}
		} catch (err) {
			showToast("Registration failed. Please try again.", "error");
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
					Register
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
					<TextField
						fullWidth
						label="Confirm Password"
						type="password"
						margin="normal"
						required
						value={formData.confirmPassword}
						onChange={(e) =>
							setFormData({ ...formData, confirmPassword: e.target.value })
						}
						error={!!errors.confirmPassword}
						helperText={errors.confirmPassword}
						disabled={loading}
					/>

					<FormControl
						component="fieldset"
						sx={{ mt: 2 }}
						error={!!errors.role}
						disabled={loading}
					>
						<FormLabel component="legend">Account Type</FormLabel>
						<RadioGroup
							value={formData.role}
							onChange={(e) =>
								setFormData({
									...formData,
									role: e.target.value as "buyer" | "seller",
								})
							}
						>
							<FormControlLabel
								value="buyer"
								control={<Radio />}
								label="Buyer"
							/>
							<FormControlLabel
								value="seller"
								control={<Radio />}
								label="Seller"
							/>
						</RadioGroup>
					</FormControl>

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
						{loading ? (
							<CircularProgress size={24} color="inherit" />
						) : (
							"Register"
						)}
					</Button>
				</form>

				<Box sx={{ textAlign: "center", mt: 2 }}>
					<Typography variant="body2">
						Already have an account?{" "}
						<MuiLink component={Link} to="/login" sx={{ color: "#67442E" }}>
							Login here
						</MuiLink>
					</Typography>
				</Box>
			</Paper>
		</Container>
	);
}
