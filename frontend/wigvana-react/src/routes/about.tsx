import { createFileRoute } from "@tanstack/react-router";

import { Container, Typography, Box, Paper, Grid } from "@mui/material";

export const Route = createFileRoute("/about")({
	component: About,
});

function About() {
	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<Paper elevation={0} sx={{ p: 4, bgcolor: "transparent" }}>
				<Typography
					variant="h4"
					gutterBottom
					sx={{ color: "#67442E", textAlign: "center", mb: 4 }}
				>
					About WigVana
				</Typography>

				<Grid container spacing={4}>
					<Grid size={{ xs: 12 }}>
						<Box sx={{ mb: 4 }}>
							<Typography variant="h5" gutterBottom sx={{ color: "#67442E" }}>
								Our Story
							</Typography>
							<Typography variant="body1" paragraph>
								WigVana is Ethiopia's premier online marketplace for
								high-quality wigs. Founded in 2024, we connect wig enthusiasts
								with trusted sellers across the country.
							</Typography>
						</Box>

						<Box sx={{ mb: 4 }}>
							<Typography variant="h5" gutterBottom sx={{ color: "#67442E" }}>
								Our Mission
							</Typography>
							<Typography variant="body1" paragraph>
								To provide a seamless platform where buyers can find their
								perfect wig and sellers can grow their businesses. We believe in
								quality, authenticity, and excellent customer service.
							</Typography>
						</Box>

						<Box sx={{ mb: 4 }}>
							<Typography variant="h5" gutterBottom sx={{ color: "#67442E" }}>
								What We Offer
							</Typography>
							<Typography variant="body1" paragraph>
								• Wide selection of natural and synthetic wigs
								<br />• Verified local sellers
								<br />• Secure shopping experience
								<br />• Easy product listing for sellers
							</Typography>
						</Box>

						<Box>
							<Typography variant="h5" gutterBottom sx={{ color: "#67442E" }}>
								Quality Assurance
							</Typography>
							<Typography variant="body1" paragraph>
								We work only with reputable sellers who meet our quality
								standards. Each product listing is reviewed to ensure accurate
								descriptions and fair pricing.
							</Typography>
						</Box>
					</Grid>
				</Grid>
			</Paper>
		</Container>
	);
}
