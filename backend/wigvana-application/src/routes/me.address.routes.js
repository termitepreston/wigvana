import express from "express";
import { addressController } from "../controllers/address.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createAddressSchema,
  updateAddressSchema,
  getAddressParamsSchema,
} from "../dtos/address.dto.js";

const router = express.Router();

router.use(protect);
router.use(authorize(["buyer"]));

/**
 * @openapi
 * tags:
 *   name: Buyer Addresses
 *   description: Management of authenticated buyer's addresses.
 */

/**
 * @openapi
 * /me/addresses:
 *   post:
 *     summary: Add a new address for the buyer
 *     tags: [Buyer Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressInput'
 *     responses:
 *       201:
 *         description: Address created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AddressResponse'
 *       400:
 *         description: Bad request (validation error).
 *       401:
 *         description: Unauthorized.
 */
router.post(
  "/",
  validate(createAddressSchema),
  addressController.createMyAddress,
);

/**
 * @openapi
 * /me/addresses:
 *   get:
 *     summary: List buyer's addresses
 *     tags: [Buyer Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of the buyer's addresses.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AddressResponse'
 *       401:
 *         description: Unauthorized.
 */
router.get("/", addressController.listMyAddresses);

/**
 * @openapi
 * /me/addresses/{addressId}:
 *   get:
 *     summary: Get details of a specific address
 *     tags: [Buyer Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathAddressId' # Define this in common.dto.js
 *     responses:
 *       200:
 *         description: Detailed information about the address.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AddressResponse'
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Address not found.
 */
router.get(
  "/:addressId",
  validate(getAddressParamsSchema),
  addressController.getMyAddressDetails,
);

/**
 * @openapi
 * /me/addresses/{addressId}:
 *   put:
 *     summary: Update an address
 *     tags: [Buyer Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathAddressId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressInput' # Can reuse input, or a partial version
 *     responses:
 *       200:
 *         description: Address updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AddressResponse'
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Address not found.
 */
router.put(
  "/:addressId",
  validate(updateAddressSchema),
  addressController.updateMyAddress,
);

/**
 * @openapi
 * /me/addresses/{addressId}:
 *   delete:
 *     summary: Delete an address
 *     tags: [Buyer Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pathAddressId'
 *     responses:
 *       204:
 *         description: Address deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Address not found.
 */
router.delete(
  "/:addressId",
  validate(getAddressParamsSchema),
  addressController.deleteMyAddress,
);

export default router;
