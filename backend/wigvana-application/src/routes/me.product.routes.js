import express from "express";
import { productController } from "../controllers/product.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import httpStatusCodes from "http-status-codes";
import ApiError from "../errors/ApiError.js";
import { z } from "zod";
import {
  createProductSchema,
  updateProductSchema,
  patchProductSchema,
  listSellerProductsQuerySchema,
  getProductParamsSchema, // Reused
} from "../dtos/product.dto.js";
import { objectIdSchema } from "../dtos/common.dto.js";
import productVariantRoutes from "./me.product.variant.routes.js";
import multer from "multer"; // For file uploads

// Multer setup (configure storage as needed, e.g., memoryStorage or diskStorage)
// For simplicity, using memoryStorage. In production, use diskStorage or direct S3 upload.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          httpStatusCodes.BAD_REQUEST,
          "Only image files are allowed!",
        ),
        false,
      );
    }
  },
});

const router = express.Router();

router.use(protect);
router.use(authorize(["seller"]));

/**
 * @openapi
 * tags:
 *   name: Seller Products
 *   description: Management of authenticated seller's own products.
 */

/**
 * @openapi
 * /me/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Seller Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductInput'
 *     responses:
 *       201:
 *         description: Product created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product' # Or SellerProductListItem
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.post(
  "/",
  validate(createProductSchema),
  productController.createMyProduct,
);

/**
 * @openapi
 * /me/products:
 *   get:
 *     summary: List seller's own products
 *     tags: [Seller Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [published, draft, pending_approval, rejected, all] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: sort_by
 *         schema: { $ref: '#/components/schemas/ProductSortByEnum' } # Define this enum
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: A paginated list of the seller's products.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSellerProducts'
 *       401:
 *         description: Unauthorized.
 */
router.get(
  "/",
  validate(listSellerProductsQuerySchema),
  productController.listMyProducts,
);

/**
 * @openapi
 * /me/products/{productId}:
 *   get:
 *     summary: Get details of a specific product owned by the seller
 *     tags: [Seller Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathProductId'
 *     responses:
 *       200:
 *         description: Product details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product' # Or SellerProductListItem
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Product not found or not owned by seller.
 */
router.get(
  "/:productId",
  validate(getProductParamsSchema),
  productController.getMyProductDetails,
);

/**
 * @openapi
 * /me/products/{productId}:
 *   put:
 *     summary: Update a product owned by the seller
 *     tags: [Seller Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathProductId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductInput'
 *     responses:
 *       200:
 *         description: Product updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Product not found.
 */
router.put(
  "/:productId",
  validate(updateProductSchema),
  productController.updateMyProduct,
);

/**
 * @openapi
 * /me/products/{productId}:
 *   patch:
 *     summary: Partially update a product owned by the seller
 *     tags: [Seller Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathProductId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatchProductInput'
 *     responses:
 *       200:
 *         description: Product partially updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Product not found.
 */
router.patch(
  "/:productId",
  validate(patchProductSchema),
  productController.patchMyProduct,
);

/**
 * @openapi
 * /me/products/{productId}:
 *   delete:
 *     summary: Delete a product owned by the seller
 *     tags: [Seller Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathProductId'
 *     responses:
 *       204:
 *         description: Product deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Product not found.
 */
router.delete(
  "/:productId",
  validate(getProductParamsSchema),
  productController.deleteMyProduct,
);

/**
 * @openapi
 * /me/products/{productId}/images:
 *   post:
 *     summary: Upload images for a seller's product
 *     tags: [Seller Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathProductId'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images: # Name of the field in form-data
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary # Indicates file upload
 *     responses:
 *       201:
 *         description: Images uploaded and associated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductImage' # Assuming ProductImage schema exists
 *       400:
 *         description: Bad request (e.g., no files, invalid file type).
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Product not found.
 */
router.post(
  "/:productId/images",
  upload.array("images", 5), // 'images' is the field name, max 5 files
  validate(getProductParamsSchema), // Validate productId from path
  productController.uploadMyProductImages,
);

/**
 * @openapi
 * /me/products/{productId}/images/{imageId}:
 *   delete:
 *     summary: Delete an image for a seller's product
 *     tags: [Seller Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathProductId'
 *       - name: imageId # Define pathImageId or similar in common.dto.js
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the product image.
 *     responses:
 *       204:
 *         description: Image deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Product or image not found.
 */
router.delete(
  "/:productId/images/:imageId",
  validate(
    z.object({
      params: z.object({ productId: objectIdSchema, imageId: objectIdSchema }),
    }),
  ),
  productController.deleteMyProductImage,
);

router.use("/:productId/variants", productVariantRoutes);

export default router;
