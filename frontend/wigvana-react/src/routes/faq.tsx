import { createFileRoute } from "@tanstack/react-router";

import {
	Container,
	Typography,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export const Route = createFileRoute("/faq")({
	component: FAQ,
});

function FAQ() {
	const faqs = [
		{
			question: "How do I place an order?",
			answer:
				"To place an order, simply browse our products, select the item you want, choose your preferred length and color, and add it to your cart. Once you're ready, proceed to checkout and follow the payment instructions.",
		},
		{
			question: "What payment methods do you accept?",
			answer:
				"We accept various payment methods including credit/debit cards, bank transfers, and mobile money services like CBE Birr and Telebirr.",
		},
		{
			question: "How long does shipping take?",
			answer:
				"Shipping typically takes 2-3 business days within Addis Ababa, and 5-7 business days for other regions in Ethiopia. International shipping is currently not available.",
		},
		{
			question: "What is your return policy?",
			answer:
				"We accept returns within 7 days of delivery if the wig is unworn and in its original packaging. Please see our Returns page for detailed information.",
		},
		{
			question: "How do I track my order?",
			answer:
				"Once your order is shipped, you'll receive a tracking number via email. You can use this number to track your package through our website or the courier's website.",
		},
		{
			question: "Do you offer custom wigs?",
			answer:
				"Yes, some of our sellers offer custom wig services. You can check individual seller profiles or contact them directly to discuss custom orders.",
		},
		{
			question: "How do I care for my wig?",
			answer:
				"Each wig comes with specific care instructions. Generally, we recommend using specialized wig care products, gentle washing, and proper storage to maintain the quality of your wig.",
		},
		{
			question: "Can I change or cancel my order?",
			answer:
				"Orders can be modified or cancelled within 1 hour of placing them. After this window, please contact our customer service for assistance.",
		},
		{
			question: "Do you offer wholesale prices?",
			answer:
				"Yes, we offer wholesale prices for bulk orders. Please contact our sales team for wholesale inquiries and pricing.",
		},
		{
			question: "How can I contact customer service?",
			answer:
				"You can reach our customer service team through email at support@wigvana.com, phone at +251 911 123 456, or through the chat feature on our website.",
		},
	].map((faq, index) => ({ ...faq, id: index }));

	return (
		<Container sx={{ py: 4 }}>
			<Typography variant="h4" sx={{ mb: 4, color: "#67442E" }}>
				Frequently Asked Questions
			</Typography>

			<Box sx={{ mb: 4 }}>
				{faqs.map((faq) => (
					<Accordion key={faq.id} sx={{ mb: 2 }}>
						<AccordionSummary
							expandIcon={<ExpandMoreIcon />}
							sx={{
								bgcolor: "#FBF7F4",
								"&:hover": {
									bgcolor: "#f5ede7",
								},
							}}
						>
							<Typography variant="h6">{faq.question}</Typography>
						</AccordionSummary>
						<AccordionDetails>
							<Typography variant="body1">{faq.answer}</Typography>
						</AccordionDetails>
					</Accordion>
				))}
			</Box>

			<Box sx={{ mt: 4, p: 3, bgcolor: "#FBF7F4", borderRadius: 1 }}>
				<Typography variant="h6" gutterBottom>
					Still have questions?
				</Typography>
				<Typography variant="body1">
					Contact our customer support team at support@wigvana.com or call us at
					+251 911 123 456. We're available Monday through Saturday, 9:00 AM -
					6:00 PM.
				</Typography>
			</Box>
		</Container>
	);
}
