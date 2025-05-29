import express from "express";
import { productVariantController } from "../controllers/product.variant.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createProductVariantSchema,
  updateProductVariantSchema,
  patchProductVariantSchema,
  productVariantParamsSchema, // For GET one, DELETE
  listProductVariantsParamsSchema, // For GET all variants of a product (only productId in params)
} from "../dtos/product.variant.dto.js";

// This router will be mounted with a :productId param already in its base path
// e.g., app.use('/me/products/:productId/variants', productVariantRoutes);
const router = express.Router({ mergeParams: true }); // mergeParams allows access to :productId

router.use(protect);
router.use(authorize(["seller"]));

/**
 * @openapi
 * tags:
 *   name: Seller Product Variants
 *   description: Management of variants for a seller's own products.
 * parameters: # Common parameter for all routes in this file
 *   - $ref: '#/components/parameters/pathProductId'
 */

/**
 * @openapi
 * /me/products/{productId}/variants:
 *   post:
 *     summary: Add a variant to a seller's product
 *     tags: [Seller Product Variants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductVariantInput'
 *     responses:
 *       201:
 *         description: Variant added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariantResponse'
 *       400: Bad request.
 *       401: Unauthorized.
 *       403: Forbidden.
 *       404: Product not found.
 *       409: Conflict (e.g., SKU already exists).
 */
router.post(
  "/",
  validate(createProductVariantSchema),
  productVariantController.addMyProductVariant,
);

/**
 * @openapi
 * /me/products/{productId}/variants:
 *   get:
 *     summary: List variants for a seller's product
 *     tags: [Seller Product Variants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of product variants.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductVariantResponse'
 *       401: Unauthorized.
 *       403: Forbidden.
 *       404: Product not found.
 */
router.get(
  "/",
  validate(listProductVariantsParamsSchema),
  productVariantController.listMyProductVariants,
);

/**
 * @openapi
 * /me/products/{productId}/variants/{variantId}:
 *   get:
 *     summary: Get details of a specific variant for a seller's product
 *     tags: [Seller Product Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathVariantId'
 *     responses:
 *       200:
 *         description: Variant details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariantResponse'
 *       401: Unauthorized.
 *       403: Forbidden.
 *       404: Product or variant not found.
 */
router.get(
  "/:variantId",
  validate(productVariantParamsSchema),
  productVariantController.getMyProductVariantDetails,
);

/**
 * @openapi
 * /me/products/{productId}/variants/{variantId}:
 *   put:
 *     summary: Update a variant for a seller's product
 *     tags: [Seller Product Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathVariantId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductVariantInput' # PUT uses full input
 *     responses:
 *       200:
 *         description: Variant updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariantResponse'
 *       400: Bad request.
 *       401: Unauthorized.
 *       403: Forbidden.
 *       404: Product or variant not found.
 *       409: Conflict (e.g., SKU already exists).
 */
router.put(
  "/:variantId",
  validate(updateProductVariantSchema),
  productVariantController.updateMyProductVariant,
);

/**
 * @openapi
 * /me/products/{productId}/variants/{variantId}:
 *   patch:
 *     summary: Partially update stock/price or other details for a variant
 *     tags: [Seller Product Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathVariantId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatchProductVariantInput'
 *     responses:
 *       200:
 *         description: Variant partially updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariantResponse'
 *       400: Bad request.
 *       401: Unauthorized.
 *       403: Forbidden.
 *       404: Product or variant not found.
 *       409: Conflict (e.g., SKU already exists).
 */
router.patch(
  "/:variantId",
  validate(patchProductVariantSchema),
  productVariantController.patchMyProductVariant,
);

/**
 * @openapi
 * /me/products/{productId}/variants/{variantId}:
 *   delete:
 *     summary: Delete a variant from a seller's product
 *     tags: [Seller Product Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathVariantId'
 *     responses:
 *       204:
 *         description: Variant deleted successfully.
 *       401: Unauthorized.
 *       403: Forbidden.
 *       404: Product or variant not found.
 */
router.delete(
  "/:variantId",
  validate(productVariantParamsSchema),
  productVariantController.deleteMyProductVariant,
);

export default router;
