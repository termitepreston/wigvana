import Product from "../models/Product.model.js";
import ProductVariant from "../models/ProductVariant.model.js";
import Review from "../models/Review.model.js";
import Category from "../models/Category.model.js";
import ProductImage from "../models/ProductImage.model.js";
import ApiError from "../errors/ApiError.js";
import httpStatusCodes from "http-status-codes";
import { redisService } from "./redis.service.js";
import logger from "../utils/logger.js";

const PRODUCT_CACHE_TTL_SECONDS = 60 * 5; // 5 minutes
const FEATURED_PRODUCTS_CACHE_KEY = "featured_products";
const PRODUCT_DETAIL_CACHE_KEY_PREFIX = "product_detail:";
const PRODUCT_VARIANTS_CACHE_KEY_PREFIX = "product_variants:";

/**
 * Constructs the base query for fetching published and approved products.
 * @returns {import('mongoose').FilterQuery<Product>} Mongoose query object.
 */
const getBaseProductQuery = () => {
  return {
    isPublished: true,
    approvalStatus: "approved",
  };
};

/**
 * Lists all published and approved products with filtering, sorting, and pagination.
 * @param {typeof import('../dtos/product.dto.js').listProductsQuerySchema._input.query} queryOptions - Options for filtering, sorting, and pagination.
 * @returns {Promise<{results: Array<InstanceType<typeof Product>>, page: number, limit: number, totalPages: number, totalResults: number}>} Paginated products.
 */
const listProducts = async (queryOptions) => {
  const {
    category,
    search,
    sort_by,
    order,
    page,
    limit,
    minPrice,
    maxPrice,
    brand,
  } = queryOptions;

  const filter = getBaseProductQuery();

  if (category) {
    filter.categoryId = category;
  }
  if (search) {
    filter.$text = { $search: search }; // Assumes text index on name, description
  }
  if (brand) {
    filter.brand = { $regex: brand, $options: "i" }; // Case-insensitive brand search
  }
  if (typeof minPrice === "number") {
    filter.basePrice = { ...filter.basePrice, $gte: minPrice };
  }
  if (typeof maxPrice === "number") {
    filter.basePrice = { ...filter.basePrice, $lte: maxPrice };
  }

  const sortOptions = {};
  if (sort_by) {
    sortOptions[sort_by] = order === "asc" ? 1 : -1;
  } else {
    sortOptions.createdAt = -1; // Default sort
  }

  const skip = (page - 1) * limit;

  const products = await Product.find(filter)
    .populate("categoryId", "name slug") // Populate category name/slug
    // .populate('sellerId', 'storeName') // If you want to show seller store name
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .lean(); // Use .lean() for better performance if not modifying docs

  const totalResults = await Product.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: products,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

/**
 * Gets details of a specific published and approved product.
 * Caches the result in Redis.
 * @param {string} productId - The ID of the product.
 * @returns {Promise<InstanceType<typeof Product> | null>} The product or null if not found.
 */
const getProductById = async (productId) => {
  const cacheKey = `${PRODUCT_DETAIL_CACHE_KEY_PREFIX}${productId}`;
  const cachedProduct = await redisService.get(cacheKey);
  if (cachedProduct) {
    logger.debug(`Cache hit for product ID: ${productId}`);
    return JSON.parse(cachedProduct);
  }
  logger.debug(`Cache miss for product ID: ${productId}`);

  const product = await Product.findOne({
    _id: productId,
    ...getBaseProductQuery(),
  })
    .populate("categoryId", "name slug")
    // .populate({ path: 'variants', model: ProductVariant }) // If you decide to populate variants directly
    .lean();

  if (!product) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Product not found or not available",
    );
  }

  await redisService.set(
    cacheKey,
    JSON.stringify(product),
    PRODUCT_CACHE_TTL_SECONDS,
  );
  return product;
};

/**
 * Lists active variants for a specific product.
 * Caches the result in Redis.
 * @param {string} productId - The ID of the product.
 * @returns {Promise<Array<InstanceType<typeof ProductVariant>>>} List of product variants.
 */
const listProductVariants = async (productId) => {
  // First, ensure the parent product exists and is accessible
  await getProductById(productId); // This also handles the 404 for the product

  const cacheKey = `${PRODUCT_VARIANTS_CACHE_KEY_PREFIX}${productId}`;
  const cachedVariants = await redisService.get(cacheKey);
  if (cachedVariants) {
    logger.debug(`Cache hit for variants of product ID: ${productId}`);
    return JSON.parse(cachedVariants);
  }
  logger.debug(`Cache miss for variants of product ID: ${productId}`);

  const variants = await ProductVariant.find({
    productId,
    isActive: true,
  }).lean();
  await redisService.set(
    cacheKey,
    JSON.stringify(variants),
    PRODUCT_CACHE_TTL_SECONDS,
  );
  return variants;
};

/**
 * Gets details of a specific active product variant.
 * @param {string} productId - The ID of the parent product.
 * @param {string} variantId - The ID of the product variant.
 * @returns {Promise<InstanceType<typeof ProductVariant> | null>} The product variant or null if not found.
 */
const getProductVariantById = async (productId, variantId) => {
  // Ensure the parent product exists and is accessible
  await getProductById(productId); // This also handles the 404 for the product

  const variant = await ProductVariant.findOne({
    _id: variantId,
    productId,
    isActive: true,
  }).lean();

  if (!variant) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Product variant not found or not active",
    );
  }
  return variant;
};

/**
 * Retrieves featured products (published and approved).
 * Caches the result in Redis.
 * @returns {Promise<Array<InstanceType<typeof Product>>>} List of featured products.
 */
const getFeaturedProducts = async () => {
  const cachedFeatured = await redisService.get(FEATURED_PRODUCTS_CACHE_KEY);
  if (cachedFeatured) {
    logger.debug("Cache hit for featured products");
    return JSON.parse(cachedFeatured);
  }
  logger.debug("Cache miss for featured products");

  const featuredProducts = await Product.find({
    ...getBaseProductQuery(),
    isFeatured: true,
  })
    .populate("categoryId", "name slug")
    .sort({ updatedAt: -1 }) // Example sort for featured
    .limit(10) // Limit number of featured products
    .lean();

  await redisService.set(
    FEATURED_PRODUCTS_CACHE_KEY,
    JSON.stringify(featuredProducts),
    PRODUCT_CACHE_TTL_SECONDS,
  );
  return featuredProducts;
};

/**
 * Lists approved reviews for a specific product with pagination.
 * @param {string} productId - The ID of the product.
 * @param {{page: number, limit: number}} paginationOptions - Pagination options.
 * @returns {Promise<{results: Array<InstanceType<typeof Review>>, page: number, limit: number, totalPages: number, totalResults: number}>} Paginated reviews.
 */
const listProductReviews = async (productId, paginationOptions) => {
  const { page, limit } = paginationOptions;

  // Ensure the product exists and is accessible before fetching reviews
  await getProductById(productId);

  const filter = {
    productId,
    isApproved: true,
  };

  const skip = (page - 1) * limit;

  const reviews = await Review.find(filter)
    .populate("userId", "firstName lastName profilePictureUrl") // Populate some user details, be mindful of privacy
    // .populate('sellerResponseId') // If you want to nest the response
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Anonymize or select specific user fields for display
  const formattedReviews = reviews.map((review) => ({
    ...review,
    user: review.userId
      ? {
          // Check if userId was populated
          // id: review.userId._id, // Don't expose actual user ID unless intended
          firstName: review.userId.firstName,
          // Consider showing only initials or a display name for privacy
          // lastNameInitial: review.userId.lastName ? `${review.userId.lastName.charAt(0)}.` : '',
          profilePictureUrl: review.userId.profilePictureUrl,
        }
      : { firstName: "Anonymous" }, // Fallback if user somehow not populated or deleted
    userId: undefined, // Remove the full userId object from final output
  }));

  const totalResults = await Review.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: formattedReviews,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

/**
 * Creates a new product for a seller.
 * @param {string} sellerId - The ID of the seller.
 * @param {typeof import('../dtos/product.dto.js').createProductSchema._input.body} productData - Product details.
 * @returns {Promise<InstanceType<typeof Product>>} The created product document.
 */
const createSellerProduct = async (sellerId, productData) => {
  // Ensure category exists
  const category = await Category.findById(productData.categoryId);
  if (!category || !category.isActive) {
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      "Invalid or inactive category ID.",
    );
  }

  // Generate slug (can be more sophisticated to ensure uniqueness per seller or globally)
  const slugBase = productData.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
  let slug = slugBase;
  let count = 0;
  // Basic slug uniqueness check (can be improved with a loop and DB check)
  while (await Product.exists({ slug })) {
    count++;
    slug = `${slugBase}-${count}`;
  }
  if (count > 0)
    logger.info(
      `Generated unique slug: ${slug} for product name: ${productData.name}`,
    );

  const product = await Product.create({
    ...productData,
    sellerId,
    slug,
    approvalStatus: "pending", // New products default to pending admin approval
    // isPublished is taken from productData (defaults to true if not provided)
  });
  return product;
};

/**
 * Lists products owned by a specific seller.
 * @param {string} sellerId - The ID of the seller.
 * @param {typeof import('../dtos/product.dto.js').listSellerProductsQuerySchema._input.query} queryOptions - Options for filtering, sorting, pagination.
 * @returns {Promise<{results: Array<InstanceType<typeof Product>>, page: number, limit: number, totalPages: number, totalResults: number}>} Paginated products.
 */
const listSellerOwnedProducts = async (sellerId, queryOptions) => {
  const { page, limit, status, search, categoryId, sort_by, order } =
    queryOptions;
  const filter = { sellerId };

  if (categoryId) filter.categoryId = categoryId;
  if (search) filter.$text = { $search: search };

  if (status && status !== "all") {
    switch (status) {
      case "published":
        filter.isPublished = true;
        filter.approvalStatus = "approved"; // Only show approved if filtering for published
        break;
      case "draft":
        filter.isPublished = false;
        break;
      case "pending_approval":
        filter.approvalStatus = "pending";
        break;
      case "rejected":
        filter.approvalStatus = "rejected";
        break;
      // no default
    }
  }

  const sortOptions = {};
  if (sort_by) sortOptions[sort_by] = order === "asc" ? 1 : -1;
  else sortOptions.createdAt = -1;

  const skip = (page - 1) * limit;
  const products = await Product.find(filter)
    .populate("categoryId", "name")
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalResults = await Product.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: products,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

/**
 * Gets details of a specific product owned by the seller.
 * @param {string} sellerId - The ID of the seller.
 * @param {string} productId - The ID of the product.
 * @returns {Promise<InstanceType<typeof Product>>} The product document.
 */
const getSellerOwnedProductById = async (sellerId, productId) => {
  const product = await Product.findOne({ _id: productId, sellerId }).populate(
    "categoryId",
    "name slug",
  );
  // .populate({ path: 'variants', model: ProductVariant }); // If variants are directly linked

  if (!product) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Product not found or does not belong to you.",
    );
  }
  // Invalidate cache if this product was cached publicly
  await redisService.del(`${PRODUCT_DETAIL_CACHE_KEY_PREFIX}${productId}`);
  return product;
};

/**
 * Updates a product owned by the seller. (PUT semantics - full update)
 * @param {string} sellerId - The ID of the seller.
 * @param {string} productId - The ID of the product to update.
 * @param {typeof import('../dtos/product.dto.js').updateProductSchema._input.body} updateData - Data for update.
 * @returns {Promise<InstanceType<typeof Product>>} The updated product document.
 */
const updateSellerOwnedProduct = async (sellerId, productId, updateData) => {
  const product = await Product.findOne({ _id: productId, sellerId });
  if (!product) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Product not found or does not belong to you.",
    );
  }

  // Ensure category exists if changed
  if (
    updateData.categoryId &&
    updateData.categoryId !== product.categoryId.toString()
  ) {
    const category = await Category.findById(updateData.categoryId);
    if (!category || !category.isActive) {
      throw new ApiError(
        httpStatusCodes.BAD_REQUEST,
        "Invalid or inactive category ID.",
      );
    }
  }

  // If name changes, slug might need to be regenerated (handle uniqueness)
  if (updateData.name && updateData.name !== product.name) {
    const slugBase = updateData.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
    let newSlug = slugBase;
    let count = 0;
    while (await Product.exists({ slug: newSlug, _id: { $ne: product._id } })) {
      count++;
      newSlug = `${slugBase}-${count}`;
    }
    updateData.slug = newSlug;
  } else {
    // Keep existing slug if name not changed or not provided in updateData (for PATCH)
    updateData.slug = undefined;
  }

  // Update product fields
  Object.assign(product, updateData);
  product.approvalStatus = "pending"; // Updates might require re-approval

  await product.save();
  await redisService.del(`${PRODUCT_DETAIL_CACHE_KEY_PREFIX}${productId}`);
  await redisService.del(FEATURED_PRODUCTS_CACHE_KEY); // If it was featured
  return product.populate("categoryId", "name slug");
};

/**
 * Partially updates a product owned by the seller. (PATCH semantics)
 * @param {string} sellerId - The ID of the seller.
 * @param {string} productId - The ID of the product to update.
 * @param {typeof import('../dtos/product.dto.js').patchProductSchema._input.body} updateData - Data for partial update.
 * @returns {Promise<InstanceType<typeof Product>>} The updated product document.
 */
const patchSellerOwnedProduct = async (sellerId, productId, updateData) => {
  // This can reuse the updateSellerOwnedProduct logic if it handles partial data correctly
  // Or implement specific partial update logic here.
  // For simplicity, we'll reuse but ensure it's a findOneAndUpdate for true PATCH behavior.

  const product = await Product.findOne({ _id: productId, sellerId });
  if (!product) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Product not found or does not belong to you.",
    );
  }

  if (
    updateData.categoryId &&
    updateData.categoryId !== product.categoryId.toString()
  ) {
    const category = await Category.findById(updateData.categoryId);
    if (!category || !category.isActive) {
      throw new ApiError(
        httpStatusCodes.BAD_REQUEST,
        "Invalid or inactive category ID.",
      );
    }
  }

  if (updateData.name && updateData.name !== product.name) {
    const slugBase = updateData.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
    let newSlug = slugBase;
    let count = 0;
    while (await Product.exists({ slug: newSlug, _id: { $ne: product._id } })) {
      count++;
      newSlug = `${slugBase}-${count}`;
    }
    updateData.slug = newSlug;
  } else {
    updateData.slug = undefined; // Don't update slug if name isn't changing
  }

  // For PATCH, only apply fields present in updateData

  for (const key of Object.keys(updateData)) {
    product[key] = updateData[key];
  }

  // If any significant field is updated, reset approval status
  const significantFieldsUpdated = [
    "name",
    "description",
    "categoryId",
    "basePrice",
  ].some((field) => updateData[field] !== undefined);
  if (significantFieldsUpdated) {
    product.approvalStatus = "pending";
  }

  await product.save();

  await redisService.del(`${PRODUCT_DETAIL_CACHE_KEY_PREFIX}${productId}`);
  await redisService.del(FEATURED_PRODUCTS_CACHE_KEY);
  return product.populate("categoryId", "name slug");
};

/**
 * Deletes a product owned by the seller.
 * @param {string} sellerId - The ID of the seller.
 * @param {string} productId - The ID of the product to delete.
 * @returns {Promise<void>}
 */
const deleteSellerOwnedProduct = async (sellerId, productId) => {
  const product = await Product.findOne({ _id: productId, sellerId });
  if (!product) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Product not found or does not belong to you.",
    );
  }

  // TODO: Add checks - e.g., if product is in active orders, prevent deletion or handle gracefully.
  // Delete associated variants and images
  await ProductVariant.deleteMany({ productId });
  await ProductImage.deleteMany({ productId }); // Assuming ProductImage model exists
  // Delete reviews for this product
  await Review.deleteMany({ productId });

  await product.deleteOne();

  await redisService.del(`${PRODUCT_DETAIL_CACHE_KEY_PREFIX}${productId}`);
  await redisService.del(FEATURED_PRODUCTS_CACHE_KEY);
  // Invalidate category product list caches if any
};

// Placeholder for image upload - this would involve a file storage service (S3, Cloudinary, etc.)
// and a ProductImage model.
/**
 * Adds images to a seller's product.
 * @param {string} sellerId - The ID of the seller.
 * @param {string} productId - The ID of the product.
 * @param {Array<Express.Multer.File>} files - Array of uploaded image files.
 * @returns {Promise<Array<InstanceType<typeof ProductImage>>>} Array of created product image documents.
 */
const addProductImages = async (sellerId, productId, files) => {
  const product = await Product.findOne({ _id: productId, sellerId });
  if (!product)
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Product not found or does not belong to you.",
    );
  if (!files || files.length === 0)
    throw new ApiError(httpStatusCodes.BAD_REQUEST, "No image files provided.");

  const uploadedImages = [];
  for (const file of files) {
    // 1. Upload file to cloud storage (e.g., S3, Cloudinary) -> get URL
    // This is a placeholder for actual upload logic
    const imageUrl = `https://example.com/uploads/products/${productId}/${file.filename}_${Date.now()}.${file.mimetype.split("/")[1] || "jpg"}`;
    logger.info(`Simulated upload of ${file.originalname} to ${imageUrl}`);

    // 2. Create ProductImage document
    const isCover =
      (await ProductImage.countDocuments({ productId, isCover: true })) === 0 &&
      uploadedImages.length === 0; // Make first uploaded image cover if no cover exists
    const productImage = await ProductImage.create({
      productId,
      imageUrl,
      altText: product.name, // Default alt text
      isCover,
    });
    uploadedImages.push(productImage);
  }
  await redisService.del(`${PRODUCT_DETAIL_CACHE_KEY_PREFIX}${productId}`); // Invalidate product cache
  return uploadedImages;
};

/**
 * Deletes an image for a seller's product.
 * @param {string} sellerId - The ID of the seller.
 * @param {string} productId - The ID of the product.
 * @param {string} imageId - The ID of the image to delete.
 * @returns {Promise<void>}
 */
const deleteProductImage = async (sellerId, productId, imageId) => {
  const product = await Product.findOne({ _id: productId, sellerId });
  if (!product)
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Product not found or does not belong to you.",
    );

  const image = await ProductImage.findOne({ _id: imageId, productId });
  if (!image)
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Image not found for this product.",
    );

  // 1. Delete image from cloud storage
  // placeholder: await cloudStorageService.delete(image.imageUrl);
  logger.info(`Simulated deletion of image from cloud: ${image.imageUrl}`);

  // 2. Delete ProductImage document
  await image.deleteOne();

  // If the deleted image was a cover, and other images exist, try to set a new cover
  if (image.isCover) {
    const nextImage = await ProductImage.findOne({ productId }).sort({
      displayOrder: 1,
      createdAt: 1,
    });
    if (nextImage) {
      nextImage.isCover = true;
      await nextImage.save();
    }
  }
  await redisService.del(`${PRODUCT_DETAIL_CACHE_KEY_PREFIX}${productId}`);
};

/**
 * (Admin) Lists all products from all sellers.
 * @param {typeof import('../dtos/admin.dto.js').listAdminProductsQuerySchema._input.query} queryOptions - Query options.
 * @returns {Promise<Object>} Paginated products.
 */
const listAllPlatformProducts = async (queryOptions) => {
  const {
    page,
    limit,
    sellerId,
    categoryId,
    status,
    isPublished,
    search,
    sort_by,
    order,
  } = queryOptions;
  const filter = {};

  if (sellerId) filter.sellerId = sellerId;
  if (categoryId) filter.categoryId = categoryId;
  if (status && status !== "all") filter.approvalStatus = status;
  if (isPublished !== undefined) filter.isPublished = isPublished; // isPublished is boolean or undefined
  if (search) filter.$text = { $search: search };

  const sortOptions = {};
  if (sort_by) sortOptions[sort_by] = order === "asc" ? 1 : -1;
  else sortOptions.createdAt = -1;

  const skip = (page - 1) * limit;
  const products = await Product.find(filter)
    .populate("sellerId", "firstName lastName email storeName") // storeName from SellerProfile if linked
    .populate("categoryId", "name slug")
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalResults = await Product.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);
  return { results: products, page, limit, totalPages, totalResults };
};

/**
 * (Admin) Gets details of any product on the platform.
 * @param {string} productId - ID of the product.
 * @returns {Promise<InstanceType<typeof Product>>} Product document.
 */
const adminGetProductById = async (productId) => {
  const product = await Product.findById(productId)
    .populate("sellerId", "firstName lastName email")
    .populate("categoryId", "name slug");
  if (!product)
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Product not found.");
  return product;
};

/**
 * (Admin) Updates any product (e.g., for policy violations, moderation).
 * @param {string} productId - ID of the product.
 * @param {typeof import('../dtos/admin.dto.js').adminUpdateProductSchema._input.body} updateData - Data.
 * @returns {Promise<InstanceType<typeof Product>>} Updated product.
 */
const adminUpdateProduct = async (productId, updateData) => {
  const product = await Product.findById(productId);
  if (!product)
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Product not found.");

  // Admin can update specific fields
  if (updateData.name) product.name = updateData.name; // Consider slug regeneration
  if (updateData.description) product.description = updateData.description;
  if (updateData.categoryId) {
    const category = await Category.findById(updateData.categoryId);
    if (!category || !category.isActive)
      throw new ApiError(
        httpStatusCodes.BAD_REQUEST,
        "Invalid or inactive category ID.",
      );
    product.categoryId = updateData.categoryId;
  }
  if (typeof updateData.isPublished === "boolean")
    product.isPublished = updateData.isPublished;
  if (updateData.approvalStatus)
    product.approvalStatus = updateData.approvalStatus;
  if (typeof updateData.isFeatured === "boolean")
    product.isFeatured = updateData.isFeatured;

  await product.save();
  await redisService.del(`${PRODUCT_DETAIL_CACHE_KEY_PREFIX}${productId}`);
  if (updateData.isFeatured !== undefined)
    await redisService.del(FEATURED_PRODUCTS_CACHE_KEY);
  return adminGetProductById(productId);
};

/**
 * (Admin) Deletes any product from the platform.
 * @param {string} productId - ID of the product.
 * @returns {Promise<void>}
 */
const adminDeleteProduct = async (productId) => {
  const product = await Product.findById(productId);
  if (!product)
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Product not found.");
  // Perform cascade delete or archiving logic as with seller delete
  await ProductVariant.deleteMany({ productId });
  await ProductImage.deleteMany({ productId });
  await Review.deleteMany({ productId });
  await product.deleteOne();
  await redisService.del(`${PRODUCT_DETAIL_CACHE_KEY_PREFIX}${productId}`);
  await redisService.del(FEATURED_PRODUCTS_CACHE_KEY); // If it was featured
};

/**
 * (Admin) Sets a product as featured.
 * @param {string} productId - ID of the product.
 * @returns {Promise<InstanceType<typeof Product>>} Updated product.
 */
const featureProduct = async (productId) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    { isFeatured: true },
    { new: true },
  );
  if (!product)
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Product not found.");
  await redisService.del(FEATURED_PRODUCTS_CACHE_KEY);
  await redisService.del(`${PRODUCT_DETAIL_CACHE_KEY_PREFIX}${productId}`);
  return product;
};

/**
 * (Admin) Removes a product from featured list.
 * @param {string} productId - ID of the product.
 * @returns {Promise<InstanceType<typeof Product>>} Updated product.
 */
const unfeatureProduct = async (productId) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    { isFeatured: false },
    { new: true },
  );
  if (!product)
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Product not found.");
  await redisService.del(FEATURED_PRODUCTS_CACHE_KEY);
  await redisService.del(`${PRODUCT_DETAIL_CACHE_KEY_PREFIX}${productId}`);
  return product;
};

export const productService = {
  listProducts,
  getProductById,
  listProductVariants,
  getProductVariantById,
  getFeaturedProducts,
  listProductReviews,
  createSellerProduct,
  listSellerOwnedProducts,
  getSellerOwnedProductById,
  updateSellerOwnedProduct,
  patchSellerOwnedProduct,
  deleteSellerOwnedProduct,
  addProductImages,
  deleteProductImage,
  listAllPlatformProducts,
  adminGetProductById,
  adminUpdateProduct,
  adminDeleteProduct,
  featureProduct,
  unfeatureProduct,
};
