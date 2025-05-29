import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
// import { RDFConverter } from '../utils/RDFConverter.js'; // Placeholder
// import { rdfStoreService } from '../services/RDFStoreService.js'; // Placeholder
// import logger from '../utils/logger.js'; // Placeholder

const orderItemSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    orderId: {
      type: String,
      ref: "Order",
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
    sellerId: {
      // Denormalized seller of this specific item
      type: String,
      ref: "User", // Or 'SellerProfile' if you have a distinct SellerProfile model id
      required: true,
      index: true,
    },
    productNameSnapshot: {
      // Name of the product at time of order
      type: String,
      required: true,
    },
    variantAttributesSnapshot: {
      // Attributes of the variant (e.g., {color: "Red", size: "M"})
      type: mongoose.Schema.Types.Mixed, // JSONB-like
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      // Price per unit at time of order
      type: Number, // Consider Decimal128 for currency
      required: true,
    },
    totalPrice: {
      // Calculated as quantity * unitPrice
      type: Number, // Consider Decimal128 for currency
      required: true,
    },
    itemStatus: {
      // Status specific to this item in the order
      type: String,
      enum: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
        "refunded",
      ],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
    id: false,
  },
);

// RDF Sync Placeholder
// orderItemSchema.post('save', async function(doc, next) { /* ... */ next(); });
// orderItemSchema.post('remove', async function(doc, next) { /* ... */ next(); });

/**
 * @typedef {mongoose.Model<mongoose.Document<any, any, any> & {}>} OrderItemModelType
 * @type {OrderItemModelType}
 */
const OrderItem = mongoose.model("OrderItem", orderItemSchema);

export default OrderItem;
