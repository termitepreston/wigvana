import React, { type ChangeEvent, type FormEvent, useState } from "react";
import {
	Container,
	Typography,
	Paper,
	Grid,
	Box,
	TextField,
	Button,
	Card,
	CardContent,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useToast } from "../context/ToastContext";

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
	component: Contact,
});

function Contact() {
	const { showToast } = useToast();
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		subject: "",
		message: "",
	});

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		// In a real app, this would send the message to a backend
		showToast(
			"Message sent successfully! We will get back to you soon.",
			"success",
		);
		setFormData({ name: "", email: "", subject: "", message: "" });
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	return (
		<Container maxWidth="lg" sx={{ py: 6 }}>
			{/* Header Section */}
			<Box sx={{ textAlign: "center", mb: 6 }}>
				<Typography variant="h3" sx={{ color: "#67442E", mb: 2 }}>
					Contact Us
				</Typography>
				<Typography variant="h6" sx={{ color: "text.secondary" }}>
					Have questions? We'd love to hear from you.
				</Typography>
			</Box>

			<Grid container spacing={4}>
				{/* Contact Information Cards */}
				<Grid size={{ xs: 2, md: 4 }}>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12 }}>
							<Card
								sx={{
									height: "100%",
									bgcolor: "#FBF7F4",
									transition: "transform 0.2s",
									"&:hover": { transform: "translateY(-4px)" },
								}}
							>
								<CardContent>
									<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
										<LocationOnIcon
											sx={{ color: "#67442E", mr: 2, fontSize: 28 }}
										/>
										<Typography variant="h6" sx={{ color: "#67442E" }}>
											Visit Us
										</Typography>
									</Box>
									<Typography variant="body1" sx={{ pl: 5 }}>
										Ambassador Mall, 4 Kilo
										<br />
										Addis Ababa, Ethiopia
									</Typography>
								</CardContent>
							</Card>
						</Grid>
						<Grid size={{ xs: 12 }}>
							<Card
								sx={{
									height: "100%",
									bgcolor: "#FBF7F4",
									transition: "transform 0.2s",
									"&:hover": { transform: "translateY(-4px)" },
								}}
							>
								<CardContent>
									<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
										<EmailIcon sx={{ color: "#67442E", mr: 2, fontSize: 28 }} />
										<Typography variant="h6" sx={{ color: "#67442E" }}>
											Email Us
										</Typography>
									</Box>
									<Typography variant="body1" sx={{ pl: 5 }}>
										info@wigvana.com
										<br />
										support@wigvana.com
									</Typography>
								</CardContent>
							</Card>
						</Grid>
						<Grid size={{ xs: 12 }}>
							<Card
								sx={{
									height: "100%",
									bgcolor: "#FBF7F4",
									transition: "transform 0.2s",
									"&:hover": { transform: "translateY(-4px)" },
								}}
							>
								<CardContent>
									<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
										<PhoneIcon sx={{ color: "#67442E", mr: 2, fontSize: 28 }} />
										<Typography variant="h6" sx={{ color: "#67442E" }}>
											Call Us
										</Typography>
									</Box>
									<Typography variant="body1" sx={{ pl: 5 }}>
										+251 911 123 456
										<br />
										+251 911 789 012
									</Typography>
								</CardContent>
							</Card>
						</Grid>
						<Grid size={{ xs: 12 }}>
							<Card
								sx={{
									height: "100%",
									bgcolor: "#FBF7F4",
									transition: "transform 0.2s",
									"&:hover": { transform: "translateY(-4px)" },
								}}
							>
								<CardContent>
									<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
										<AccessTimeIcon
											sx={{ color: "#67442E", mr: 2, fontSize: 28 }}
										/>
										<Typography variant="h6" sx={{ color: "#67442E" }}>
											Business Hours
										</Typography>
									</Box>
									<Typography variant="body1" sx={{ pl: 5 }}>
										Monday - Saturday: 9:00 AM - 6:00 PM
										<br />
										Sunday: Closed
									</Typography>
								</CardContent>
							</Card>
						</Grid>
					</Grid>
				</Grid>

				{/* Contact Form */}
				<Grid size={{ xs: 12, md: 8 }}>
					<Paper elevation={3} sx={{ p: 4, height: "100%", bgcolor: "#fff" }}>
						<Typography variant="h5" sx={{ color: "#67442E", mb: 4 }}>
							Send Us a Message
						</Typography>
						<form onSubmit={handleSubmit}>
							<Grid container spacing={3}>
								<Grid size={{ xs: 12, sm: 6 }}>
									<TextField
										fullWidth
										label="Your Name"
										name="name"
										value={formData.name}
										onChange={handleChange}
										required
										variant="outlined"
										sx={{
											"& .MuiOutlinedInput-root": {
												"&.Mui-focused fieldset": {
													borderColor: "#67442E",
												},
											},
										}}
									/>
								</Grid>
								<Grid size={{ xs: 12, md: 6 }}>
									<TextField
										fullWidth
										label="Your Email"
										name="email"
										type="email"
										value={formData.email}
										onChange={handleChange}
										required
										variant="outlined"
										sx={{
											"& .MuiOutlinedInput-root": {
												"&.Mui-focused fieldset": {
													borderColor: "#67442E",
												},
											},
										}}
									/>
								</Grid>
								<Grid size={{ xs: 12 }}>
									<TextField
										fullWidth
										label="Subject"
										name="subject"
										value={formData.subject}
										onChange={handleChange}
										required
										variant="outlined"
										sx={{
											"& .MuiOutlinedInput-root": {
												"&.Mui-focused fieldset": {
													borderColor: "#67442E",
												},
											},
										}}
									/>
								</Grid>
								<Grid size={{ xs: 12 }}>
									<TextField
										fullWidth
										label="Message"
										name="message"
										value={formData.message}
										onChange={handleChange}
										required
										multiline
										rows={6}
										variant="outlined"
										sx={{
											"& .MuiOutlinedInput-root": {
												"&.Mui-focused fieldset": {
													borderColor: "#67442E",
												},
											},
										}}
									/>
								</Grid>
								<Grid size={{ xs: 12 }}>
									<Button
										type="submit"
										variant="contained"
										size="large"
										fullWidth
										sx={{
											bgcolor: "#67442E",
											"&:hover": { bgcolor: "#523524" },
											py: 1.5,
											mt: 2,
										}}
									>
										Send Message
									</Button>
								</Grid>
							</Grid>
						</form>
					</Paper>
				</Grid>
			</Grid>
		</Container>
	);
}
