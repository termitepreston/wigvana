import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
// import { RDFConverter } from '../utils/RDFConverter.js'; // Placeholder
// import { rdfStoreService } from '../services/RDFStoreService.js'; // Placeholder
// import logger from '../utils/logger.js'; // Placeholder

const cartItemSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    cartId: {
      type: String,
      ref: "Cart",
      required: true,
      index: true,
    },
    productId: {
      type: String,
      ref: "Product",
      required: true,
      index: true,
    },
    variantId: {
      type: String,
      ref: "ProductVariant",
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    priceAtAddition: {
      // Store price for historical accuracy
      type: Number, // Consider Decimal128 for currency
      required: true,
    },
    currencyAtAddition: {
      // e.g., "USD"
      type: String,
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt for the cart item itself
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
    id: false,
  },
);

// Composite index to prevent duplicate product variants in the same cart
cartItemSchema.index({ cartId: 1, variantId: 1 }, { unique: true });

// RDF Sync Placeholder
// cartItemSchema.post('save', async function(doc, next) { /* ... */ next(); });
// cartItemSchema.post('remove', async function(doc, next) { /* ... */ next(); });

/**
 * @typedef {mongoose.Model<mongoose.Document<any, any, any> & {}>} CartItemModelType
 * @type {CartItemModelType}
 */
const CartItem = mongoose.model("CartItem", cartItemSchema);

export default CartItem;
