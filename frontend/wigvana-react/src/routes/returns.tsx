import { createFileRoute } from "@tanstack/react-router";

import React from "react";
import {
	Container,
	Typography,
	Paper,
	Box,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Divider,
	Grid,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RestoreIcon from "@mui/icons-material/Restore";
import SecurityIcon from "@mui/icons-material/Security";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

export const Route = createFileRoute("/returns")({
	component: Returns,
});

function Returns() {
	const eligibleItems = [
		"Unworn wigs in original packaging",
		"Items with all tags and accessories intact",
		"Products in resalable condition",
		"Items returned within 7 days of delivery",
	].map((item, index) => ({ item: item, id: index }));

	const nonEligibleItems = [
		"Worn or used wigs",
		"Items without original packaging",
		"Products damaged by customer",
		"Items returned after 7 days",
		"Custom or personalized wigs",
	].map((item, index) => ({ item: item, id: index }));

	const returnProcess = [
		{
			title: "Contact Us",
			description:
				"Email support@wigvana.com with your order number and return reason",
		},
		{
			title: "Get Authorization",
			description:
				"Receive a return authorization number and shipping instructions",
		},
		{
			title: "Package Item",
			description: "Securely pack the item in its original packaging",
		},
		{
			title: "Ship",
			description: "Send the item using the provided shipping instructions",
		},
		{
			title: "Refund",
			description:
				"Receive your refund within 5-7 business days after we receive the item",
		},
	].map((process, index) => ({ ...process, id: index }));

	return (
		<Container sx={{ py: 4 }}>
			<Typography variant="h4" sx={{ mb: 4, color: "#67442E" }}>
				Returns & Refunds Policy
			</Typography>

			<Grid container spacing={4}>
				<Grid size={{ xs: 12, md: 6 }}>
					<Paper sx={{ p: 3, height: "100%", bgcolor: "#FBF7F4" }}>
						<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
							<CheckCircleIcon sx={{ color: "#67442E", mr: 2 }} />
							<Typography variant="h6">Eligible for Return</Typography>
						</Box>
						<List>
							{eligibleItems.map((item) => (
								<ListItem key={item.id}>
									<ListItemIcon>
										<CheckCircleIcon sx={{ color: "success.main" }} />
									</ListItemIcon>
									<ListItemText primary={item.item} />
								</ListItem>
							))}
						</List>
					</Paper>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Paper sx={{ p: 3, height: "100%", bgcolor: "#FBF7F4" }}>
						<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
							<CancelIcon sx={{ color: "#67442E", mr: 2 }} />
							<Typography variant="h6">Not Eligible for Return</Typography>
						</Box>
						<List>
							{nonEligibleItems.map((item) => (
								<ListItem key={item.id}>
									<ListItemIcon>
										<CancelIcon sx={{ color: "error.main" }} />
									</ListItemIcon>
									<ListItemText primary={item.item} />
								</ListItem>
							))}
						</List>
					</Paper>
				</Grid>
			</Grid>

			<Paper sx={{ mt: 4, p: 3 }}>
				<Typography variant="h5" sx={{ mb: 3, color: "#67442E" }}>
					Return Process
				</Typography>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
					{returnProcess.map((step) => (
						<React.Fragment key={step.id}>
							<Box sx={{ display: "flex", alignItems: "start", gap: 2 }}>
								<Typography
									variant="h6"
									sx={{
										width: 24,
										height: 24,
										borderRadius: "50%",
										bgcolor: "#67442E",
										color: "white",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										fontSize: "0.875rem",
									}}
								>
									{step.id + 1}
								</Typography>
								<Box>
									<Typography variant="h6">{step.title}</Typography>
									<Typography variant="body1" color="text.secondary">
										{step.description}
									</Typography>
								</Box>
							</Box>
							{step.id < returnProcess.length - 1 && <Divider />}
						</React.Fragment>
					))}
				</Box>
			</Paper>

			<Grid container spacing={4} sx={{ mt: 2 }}>
				<Grid size={{ xs: 12, md: 4 }}>
					<Paper sx={{ p: 3, bgcolor: "#FBF7F4" }}>
						<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
							<RestoreIcon sx={{ fontSize: 40, color: "#67442E", mr: 2 }} />
							<Typography variant="h6">7-Day Returns</Typography>
						</Box>
						<Typography variant="body1">
							Return eligible items within 7 days of delivery for a full refund.
						</Typography>
					</Paper>
				</Grid>

				<Grid size={{ xs: 12, md: 4 }}>
					<Paper sx={{ p: 3, bgcolor: "#FBF7F4" }}>
						<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
							<SecurityIcon sx={{ fontSize: 40, color: "#67442E", mr: 2 }} />
							<Typography variant="h6">Quality Guarantee</Typography>
						</Box>
						<Typography variant="body1">
							We stand behind the quality of our products with our satisfaction
							guarantee.
						</Typography>
					</Paper>
				</Grid>

				<Grid size={{ xs: 12, md: 4 }}>
					<Paper sx={{ p: 3, bgcolor: "#FBF7F4" }}>
						<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
							<LocalShippingIcon
								sx={{ fontSize: 40, color: "#67442E", mr: 2 }}
							/>
							<Typography variant="h6">Free Return Shipping</Typography>
						</Box>
						<Typography variant="body1">
							We cover return shipping costs for items that arrive damaged or
							defective.
						</Typography>
					</Paper>
				</Grid>
			</Grid>
		</Container>
	);
}
