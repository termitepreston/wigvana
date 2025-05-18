import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, CircularProgress, IconButton, Typography } from "@mui/material";
import { type ChangeEvent, useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ImageUploadProps = {
	value: string;
	onChange: (props: {
		error: string | null;
		preview?: string | null;
		file?: File | null;
		base64?: string | ArrayBuffer | null;
	}) => void;
	error: string;
	touched: boolean;
};

const ImageUpload: React.FC<ImageUploadProps> = ({
	value,
	onChange,
	error,
	touched,
}) => {
	const [loading, setLoading] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(value);

	const validateFile = (file: File) => {
		if (!file) return "Please select an image";
		if (!ALLOWED_TYPES.includes(file.type)) {
			return "Only JPG, PNG and WebP images are allowed";
		}
		if (file.size > MAX_FILE_SIZE) {
			return "Image size should be less than 5MB";
		}
		return null;
	};

	const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files ? event.target.files[0] : null;
		if (!file) return;

		const error = validateFile(file);
		if (error) {
			onChange({ error });
			return;
		}

		setLoading(true);
		try {
			// Create preview URL
			const preview = URL.createObjectURL(file);
			setPreviewUrl(preview);

			// Read file as base64
			const reader = new FileReader();
			reader.onloadend = () => {
				setLoading(false);
				onChange({
					file,
					preview,
					base64: reader.result,
					error: null,
				});
			};
			reader.onerror = () => {
				setLoading(false);
				onChange({ error: "Failed to read file" });
			};
			reader.readAsDataURL(file);
		} catch (err) {
			setLoading(false);
			onChange({ error: "Failed to process image" });
		}
	};

	const handleRemove = () => {
		setPreviewUrl(null);
		onChange({
			file: null,
			preview: null,
			base64: null,
			error: null,
		});
	};

	return (
		<Box>
			<Typography variant="subtitle1" gutterBottom>
				Product Image
				<Typography component="span" color="error">
					*
				</Typography>
			</Typography>

			{previewUrl ? (
				<Box sx={{ position: "relative", width: "fit-content", mb: 2 }}>
					<img
						src={previewUrl}
						alt="Product preview"
						style={{
							maxWidth: "200px",
							maxHeight: "200px",
							objectFit: "cover",
							borderRadius: "4px",
						}}
					/>
					<IconButton
						sx={{
							position: "absolute",
							top: -8,
							right: -8,
							bgcolor: "background.paper",
							boxShadow: 1,
							"&:hover": { bgcolor: "background.paper" },
						}}
						size="small"
						onClick={handleRemove}
					>
						<DeleteIcon fontSize="small" />
					</IconButton>
				</Box>
			) : (
				<Box
					sx={{
						border: "2px dashed",
						borderColor: error && touched ? "error.main" : "divider",
						borderRadius: 1,
						p: 3,
						mb: 2,
						textAlign: "center",
						bgcolor: "background.paper",
						cursor: "pointer",
						"&:hover": {
							borderColor: "primary.main",
							bgcolor: "action.hover",
						},
					}}
					component="label"
				>
					<input
						type="file"
						hidden
						accept={ALLOWED_TYPES.join(",")}
						onChange={handleFileChange}
					/>
					{loading ? (
						<CircularProgress size={24} />
					) : (
						<>
							<CloudUploadIcon
								sx={{ fontSize: 48, color: "action.active", mb: 1 }}
							/>
							<Typography variant="subtitle1" component="div" gutterBottom>
								Drag and drop an image here or click to select
							</Typography>
							<Typography variant="caption" color="textSecondary">
								Supported formats: JPG, PNG, WebP (max 5MB)
							</Typography>
						</>
					)}
				</Box>
			)}

			{error && touched && (
				<Typography color="error" variant="caption">
					{error}
				</Typography>
			)}
		</Box>
	);
};

export default ImageUpload;
