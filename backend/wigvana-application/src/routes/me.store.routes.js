import express from "express";
import { sellerController } from "../controllers/seller.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { storeProfileInputSchema } from "../dtos/seller.dto.js";

const router = express.Router();

router.use(protect);
router.use(authorize(["seller"])); // Only sellers can access these

/**
 * @openapi
 * tags:
 *   name: Seller Store Profile
 *   description: Management of the authenticated seller's store profile.
 */

/**
 * @openapi
 * /me/store:
 *   get:
 *     summary: Get seller's store profile
 *     tags: [Seller Store Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller's store profile.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoreProfileResponse'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (user is not a seller).
 */
router.get("/", sellerController.getMyStoreProfile);

/**
 * @openapi
 * /me/store:
 *   put:
 *     summary: Create or update seller's store profile
 *     tags: [Seller Store Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoreProfileInput'
 *     responses:
 *       200:
 *         description: Store profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoreProfileResponse'
 *       201:
 *         description: Store profile created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoreProfileResponse'
 *       400:
 *         description: Bad request (validation error).
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (user is not a seller).
 */
router.put(
  "/",
  validate(storeProfileInputSchema),
  sellerController.upsertMyStoreProfile,
);

export default router;
