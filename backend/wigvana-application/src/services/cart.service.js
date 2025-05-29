import { v4 as uuidv4 } from "uuid";
import Cart from "../models/Cart.model.js";
import CartItem from "../models/CartItem.model.js";
import Product from "../models/Product.model.js";
import ProductVariant from "../models/ProductVariant.model.js";
import ApiError from "../errors/ApiError.js";
import httpStatusCodes from "http-status-codes";
import logger from "../utils/logger.js";

/**
 * Validates product and variant, and checks stock.
 * @param {string} productId - The product ID.
 * @param {string} variantId - The variant ID.
 * @param {number} quantity - The desired quantity.
 * @returns {Promise<{product: InstanceType<typeof Product>, variant: InstanceType<typeof ProductVariant>}>} Validated product and variant.
 * @throws {ApiError} If product/variant not found, not active, or insufficient stock.
 */
const validateProductAndStock = async (productId, variantId, quantity) => {
  const product = await Product.findOne({
    _id: productId,
    isPublished: true,
    approvalStatus: "approved",
  });
  if (!product) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Product not found or not available.",
    );
  }

  const variant = await ProductVariant.findOne({
    _id: variantId,
    productId,
    isActive: true,
  });
  if (!variant) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Product variant not found or not active.",
    );
  }

  if (variant.stockQuantity < quantity) {
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      `Insufficient stock for variant ${variant.sku}. Available: ${variant.stockQuantity}`,
    );
  }
  return { product, variant };
};

/**
 * Retrieves or creates a cart for an anonymous user.
 * @param {string | undefined} anonymousCartToken - The anonymous cart token (cartId).
 * @returns {Promise<InstanceType<typeof Cart>>} The cart document.
 */
const getOrCreateAnonymousCart = async (anonymousCartToken) => {
  if (anonymousCartToken) {
    const cart = await Cart.findOne({ anonymousCartToken, userId: null });
    if (cart) return cart;
    // If token provided but cart not found, it's an invalid token case, throw error
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Anonymous cart not found with the provided cartId.",
    );
  }
  // If no token, create a new cart
  const newCartId = uuidv4();
  return Cart.create({
    anonymousCartToken: newCartId,
    userId: null,
    status: "active",
  });
};

/**
 * Formats a cart for response, calculating totals.
 * @param {InstanceType<typeof Cart>} cartDoc - The Mongoose cart document.
 * @returns {Promise<Object>} Formatted cart object.
 */
const formatCartResponse = async (cartDoc) => {
  const items = await CartItem.find({ cartId: cartDoc._id })
    .populate("productId", "name slug") // Populate some product details
    .populate("variantId", "sku attributes price stockQuantity") // Populate variant details
    .lean();

  let subtotal = 0;
  let totalQuantity = 0;
  const enrichedItems = items.map((item) => {
    const itemTotal = item.priceAtAddition * item.quantity;
    subtotal += itemTotal;
    totalQuantity += item.quantity;
    return {
      id: item._id,
      productId: item.productId._id,
      productName: item.productId.name,
      productSlug: item.productId.slug,
      variantId: item.variantId._id,
      variantSku: item.variantId.sku,
      variantAttributes: item.variantId.attributes,
      quantity: item.quantity,
      priceAtAddition: item.priceAtAddition,
      currencyAtAddition: item.currencyAtAddition, // Assuming currency is same for all items for now
      // Add image later if needed
    };
  });

  return {
    id: cartDoc.anonymousCartToken || cartDoc._id, // Use anonymousCartToken as ID for anon users
    userId: cartDoc.userId,
    items: enrichedItems,
    totalItems: enrichedItems.length,
    totalQuantity,
    subtotal: Number.parseFloat(subtotal.toFixed(2)),
    currency:
      enrichedItems.length > 0 ? enrichedItems[0].currencyAtAddition : "USD", // Default or from first item
    status: cartDoc.status,
    createdAt: cartDoc.createdAt,
    updatedAt: cartDoc.updatedAt,
  };
};

/**
 * Creates a new anonymous cart and adds the first item.
 * @param {{productId: string, variantId: string, quantity: number}} itemData - Data for the first item.
 * @returns {Promise<Object>} Formatted cart details including cartId.
 */
const createAnonymousCartWithItem = async (itemData) => {
  const { productId, variantId, quantity } = itemData;
  const { product, variant } = await validateProductAndStock(
    productId,
    variantId,
    quantity,
  );

  const newCartId = uuidv4();
  const cart = await Cart.create({
    anonymousCartToken: newCartId,
    userId: null,
    status: "active",
  });

  await CartItem.create({
    cartId: cart._id,
    productId,
    variantId,
    quantity,
    priceAtAddition: variant.price, // Or product.basePrice if variant doesn't override
    currencyAtAddition: product.currency, // Assuming product.currency
  });

  cart.updatedAt = new Date();
  await cart.save();

  return formatCartResponse(cart);
};

/**
 * Adds an item to an existing anonymous cart.
 * @param {string} anonymousCartToken - The ID of the anonymous cart.
 * @param {{productId: string, variantId: string, quantity: number}} itemData - Item data.
 * @returns {Promise<Object>} Formatted cart details.
 */
const addItemToAnonymousCart = async (anonymousCartToken, itemData) => {
  const cart = await getOrCreateAnonymousCart(anonymousCartToken); // This will throw if cartId invalid
  const { productId, variantId, quantity } = itemData;
  const { product, variant } = await validateProductAndStock(
    productId,
    variantId,
    quantity,
  );

  let cartItem = await CartItem.findOne({ cartId: cart._id, variantId });

  if (cartItem) {
    // Check stock for additional quantity
    if (variant.stockQuantity < cartItem.quantity + quantity) {
      throw new ApiError(
        httpStatusCodes.BAD_REQUEST,
        `Insufficient stock. Available: ${variant.stockQuantity}, In cart: ${cartItem.quantity}, Requested: ${quantity}`,
      );
    }
    cartItem.quantity += quantity;
    // Price at addition should ideally remain the same unless business logic dictates updating it
  } else {
    cartItem = new CartItem({
      cartId: cart._id,
      productId,
      variantId,
      quantity,
      priceAtAddition: variant.price,
      currencyAtAddition: product.currency,
    });
  }
  await cartItem.save();
  cart.updatedAt = new Date();
  await cart.save();
  return formatCartResponse(cart);
};

/**
 * Views the anonymous cart.
 * @param {string} anonymousCartToken - The ID of the anonymous cart.
 * @returns {Promise<Object>} Formatted cart details.
 */
const viewAnonymousCart = async (anonymousCartToken) => {
  const cart = await getOrCreateAnonymousCart(anonymousCartToken); // Throws if invalid
  return formatCartResponse(cart);
};

/**
 * Updates item quantity in the anonymous cart.
 * @param {string} anonymousCartToken - Cart ID.
 * @param {string} itemId - Cart item ID.
 * @param {number} quantity - New quantity (must be > 0).
 * @returns {Promise<Object>} Formatted cart details.
 */
const updateAnonymousCartItem = async (
  anonymousCartToken,
  itemId,
  quantity,
) => {
  const cart = await getOrCreateAnonymousCart(anonymousCartToken);
  const cartItem = await CartItem.findOne({
    _id: itemId,
    cartId: cart._id,
  }).populate("variantId");

  if (!cartItem) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Item not found in cart.");
  }

  const variant = cartItem.variantId; // Already populated
  if (variant.stockQuantity < quantity) {
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      `Insufficient stock for variant. Available: ${variant.stockQuantity}`,
    );
  }

  cartItem.quantity = quantity;
  await cartItem.save();
  cart.updatedAt = new Date();
  await cart.save();
  return formatCartResponse(cart);
};

/**
 * Removes an item from the anonymous cart.
 * @param {string} anonymousCartToken - Cart ID.
 * @param {string} itemId - Cart item ID.
 * @returns {Promise<Object>} Formatted cart details.
 */
const removeAnonymousCartItem = async (anonymousCartToken, itemId) => {
  const cart = await getOrCreateAnonymousCart(anonymousCartToken);
  const cartItem = await CartItem.findOne({ _id: itemId, cartId: cart._id });

  if (!cartItem) {
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Item not found in cart.");
  }

  await cartItem.deleteOne(); // Use deleteOne on the document instance
  cart.updatedAt = new Date();
  await cart.save();
  return formatCartResponse(cart);
};

/**
 * Clears all items from the anonymous cart.
 * @param {string} anonymousCartToken - Cart ID.
 * @returns {Promise<Object>} Formatted (now empty) cart details.
 */
const clearAnonymousCart = async (anonymousCartToken) => {
  const cart = await getOrCreateAnonymousCart(anonymousCartToken);
  await CartItem.deleteMany({ cartId: cart._id });
  cart.updatedAt = new Date();
  // Optionally update cart status to 'abandoned' or similar if not deleting the cart doc itself
  await cart.save();
  return formatCartResponse(cart); // Will show an empty cart
};

export const cartService = {
  createAnonymousCartWithItem,
  addItemToAnonymousCart,
  viewAnonymousCart,
  updateAnonymousCartItem,
  removeAnonymousCartItem,
  clearAnonymousCart,
  // ... methods for authenticated users will be added later
};
