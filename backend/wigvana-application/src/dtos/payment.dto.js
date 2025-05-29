import { z } from "zod";
import { objectIdSchema } from "./common.dto.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     PaymentMethodInput:
 *       type: object
 *       required:
 *         - paymentToken # Token from payment provider like Stripe (e.g., PaymentMethod ID or SetupIntent client secret)
 *         - type # e.g., "card"
 *       properties:
 *         paymentToken:
 *           type: string
 *           description: "Token from the payment provider representing the payment method."
 *           example: "pm_1KbLrH2eZvKYlo2CeA3v7q9g"
 *         type:
 *           type: string
 *           example: "card"
 *           description: "Type of payment method (e.g., card, paypal_account)."
 *         cardBrand:
 *           type: string
 *           nullable: true
 *           example: "visa"
 *           description: "Card brand (e.g., visa, mastercard). Often provided by payment gateway."
 *         lastFourDigits:
 *           type: string
 *           nullable: true
 *           example: "4242"
 *           description: "Last four digits of the card. Often provided by payment gateway."
 *         expirationMonth:
 *           type: integer
 *           nullable: true
 *           example: 12
 *         expirationYear:
 *           type: integer
 *           nullable: true
 *           example: 2025
 *         billingAddressId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: "ID of an existing billing address for this payment method."
 *         isDefault:
 *           type: boolean
 *           default: false
 *     PaymentMethodResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/PaymentMethodInput' # Shows the descriptive fields
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             userId:
 *               type: string
 *               format: uuid
 *             paymentGateway:
 *               type: string
 *               example: "stripe" # Could be set server-side based on token
 *             createdAt:
 *               type: string
 *               format: "date-time"
 *             updatedAt:
 *               type: string
 *               format: "date-time"
 *     UpdatePaymentMethodDto:
 *       type: object
 *       properties:
 *         isDefault:
 *           type: boolean
 *         billingAddressId:
 *           type: string
 *           format: uuid
 *           nullable: true # Allow unsetting
 *         # Other fields like expirationMonth/Year if your gateway allows updating them directly
 *         # Usually, these are re-tokenized for PCI compliance.
 */

export const paymentMethodInputBaseSchema = z.object({
  paymentToken: z.string().trim().min(1, "Payment token is required"), // This is the token from Stripe, Braintree, etc.
  type: z
    .string()
    .trim()
    .min(1, "Payment method type is required (e.g., 'card')"),
  cardBrand: z.string().trim().nullable().optional(), // Typically derived from the token by the gateway
  lastFourDigits: z.string().trim().length(4).nullable().optional(), // Typically derived
  expirationMonth: z.coerce.number().int().min(1).max(12).nullable().optional(), // Typically derived
  expirationYear: z.coerce
    .number()
    .int()
    .min(new Date().getFullYear())
    .nullable()
    .optional(), // Typically derived
  billingAddressId: objectIdSchema.nullable().optional(),
  isDefault: z.boolean().default(false).optional(),
});

export const createPaymentMethodSchema = z.object({
  body: paymentMethodInputBaseSchema,
});

export const updatePaymentMethodSchema = z.object({
  params: z.object({
    paymentMethodId: objectIdSchema,
  }),
  body: z
    .object({
      isDefault: z.boolean().optional(),
      billingAddressId: objectIdSchema.nullable().optional(),
      // Expiration updates are usually not done directly; a new token is typically required.
    })
    .strip()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

export const getPaymentMethodParamsSchema = z.object({
  params: z.object({
    paymentMethodId: objectIdSchema,
  }),
});
